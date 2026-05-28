import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac, randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { isDatabaseConnectionError } from '@/lib/prisma';
import { hashPassword } from '@/lib/crypto';
import { signToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';

function normalizeReturnTo(value: string | null): '/' | '/admin' {
  if (!value) return '/';
  const cleaned = value.trim();
  if (cleaned === '/admin' || cleaned.startsWith('/admin/')) return '/admin';
  return '/';
}

function getLoginPath(returnTo: '/' | '/admin') {
  return returnTo === '/admin' ? '/admin/login' : '/login';
}

function getSuccessPath(returnTo: '/' | '/admin') {
  return returnTo === '/admin' ? '/admin' : '/';
}

function getAuthOrigin(requestUrl: string) {
  const requestOrigin = new URL(requestUrl).origin;
  const configuredAppUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredAppUrl) {
    return requestOrigin;
  }

  try {
    return new URL(configuredAppUrl).origin;
  } catch {
    return requestOrigin;
  }
}

function redirectWithError(origin: string, returnTo: '/' | '/admin', error: string) {
  return NextResponse.redirect(`${origin}${getLoginPath(returnTo)}?error=${error}`);
}

function createOAuthState(returnTo: '/' | '/admin') {
  const payload = {
    nonce: randomUUID(),
    returnTo,
    issuedAt: Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', env.JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function parseOAuthState(state: string | null): { returnTo: '/' | '/admin' } | null {
  if (!state) return null;

  const [encodedPayload, signature] = state.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmac('sha256', env.JWT_SECRET).update(encodedPayload).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      returnTo?: string;
      issuedAt?: number;
    };

    if (typeof parsed.issuedAt !== 'number' || Date.now() - parsed.issuedAt > 10 * 60 * 1000) {
      return null;
    }

    return {
      returnTo: normalizeReturnTo(typeof parsed.returnTo === 'string' ? parsed.returnTo : null),
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = getAuthOrigin(request.url);
    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    const returnTo = normalizeReturnTo(searchParams.get('returnTo'));

    if (oauthError) {
      return redirectWithError(origin, returnTo, 'google_oauth_denied');
    }

    if (!code) {
      if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.startsWith('YOUR_')) {
        return redirectWithError(origin, returnTo, 'google_not_configured');
      }

      const state = createOAuthState(returnTo);
      const redirectUri = `${origin}/api/auth/google`;
      const authParams = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        access_type: 'offline',
        include_granted_scopes: 'true',
        state,
      });

      return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`);
    }

    const parsedState = parseOAuthState(searchParams.get('state'));
    const callbackReturnTo = parsedState?.returnTo ?? '/';

    if (!parsedState) {
      return redirectWithError(origin, callbackReturnTo, 'google_oauth_state_invalid');
    }

    const redirectUri = `${origin}/api/auth/google`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID || '',
        client_secret: env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenText = await tokenRes.text();
    let tokenData: { id_token?: string } = {};
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = {};
    }

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('[Google Auth] Token exchange failed:', {
        status: tokenRes.status,
        body: tokenText,
      });
      return redirectWithError(origin, callbackReturnTo, 'google_oauth_failed');
    }

    const base64Payload = tokenData.id_token.split('.')[1];
    const decodedPayload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    const email = decodedPayload.email;
    const fullName = decodedPayload.name || email?.split('@')[0];
    const avatarUrl = decodedPayload.picture || null;

    if (!email) {
      return redirectWithError(origin, callbackReturnTo, 'google_email_missing');
    }

    const userData = await registerOrLoginGoogleUser(email, fullName, avatarUrl);

    // Kiểm tra: nếu đang login vào cổng admin nhưng tài khoản không phải ADMIN → từ chối
    if (callbackReturnTo === '/admin' && userData.role !== 'ADMIN') {
      return redirectWithError(origin, '/admin', 'google_not_admin');
    }

    const token = signToken(userData, env.JWT_SECRET, 86400);
    const cookieName = userData.role === 'ADMIN' ? 'admin_token' : 'token';

    // Sau khi admin login thành công → redirect vào dashboard /admin (không dùng getSuccessPath vì /admin là dashboard)
    const successPath = callbackReturnTo === '/admin' ? '/admin' : getSuccessPath(callbackReturnTo);
    const response = NextResponse.redirect(`${origin}${successPath}?login_success=google`);
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 1 ngày
    });
    return response;
  } catch (error) {
    console.error('[Google Auth] GET error:', error);
    const { searchParams } = new URL(request.url);
    const origin = getAuthOrigin(request.url);
    // Ưu tiên đọc returnTo từ state đã parse; fallback mới đọc query param
    let fallbackReturnTo: '/' | '/admin';
    try {
      const stateParam = searchParams.get('state');
      const parsed = stateParam ? parseOAuthState(stateParam) : null;
      fallbackReturnTo = parsed?.returnTo ?? normalizeReturnTo(searchParams.get('returnTo'));
    } catch {
      fallbackReturnTo = normalizeReturnTo(searchParams.get('returnTo'));
    }
    if (error instanceof Error && error.message === 'GOOGLE_DB_UNAVAILABLE') {
      return redirectWithError(origin, fallbackReturnTo, 'google_database_unavailable');
    }
    return redirectWithError(origin, fallbackReturnTo, 'google_server_error');
  }
}

export async function POST(request: Request) {
  try {
    const { email, fullName, avatarUrl, returnTo } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Missing Google email' }, { status: 400 });
    }

    const userData = await registerOrLoginGoogleUser(email, fullName, avatarUrl);
    const token = signToken(userData, env.JWT_SECRET, 86400);

    const cookieStore = await cookies();
    const cookieName = userData.role === 'ADMIN' ? 'admin_token' : 'token';
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 1 ngày
    });

    return NextResponse.json({
      message: 'Google login success',
      user: userData,
      redirectTo: getSuccessPath(normalizeReturnTo(typeof returnTo === 'string' ? returnTo : null)),
    });
  } catch (error) {
    console.error('[Google Auth Simulation] Error:', error);
    if (error instanceof Error && error.message === 'GOOGLE_DB_UNAVAILABLE') {
      return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });
    }
    return NextResponse.json({ message: 'Server error during Google login' }, { status: 500 });
  }
}

async function registerOrLoginGoogleUser(email: string, fullName: string, avatarUrl?: string | null) {
  // Trim dấu nháy thừa trong env (e.g. GOOGLE_ADMIN_EMAIL="tunganht26@gmail.com" với dấu nháy)
  const adminEmail = env.GOOGLE_ADMIN_EMAIL.replace(/^"|"$/g, '').trim();
  const isGoogleAdmin = email.toLowerCase() === adminEmail.toLowerCase();

  console.log('[Google Auth] registerOrLoginGoogleUser:', { email, adminEmail, isGoogleAdmin });

  try {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      let university = await prisma.university.findFirst();
      if (!university) {
        university = await prisma.university.create({
          data: {
            id: 'DHQG_HCM',
            name: 'Đại học Quốc gia TP.HCM',
            emailDomains: ['vnuhcm.edu.vn'],
          },
        });
      }

      const randomPassword = `google_${Math.random().toString(36).substring(2)}`;
      const hashedPassword = hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: isGoogleAdmin ? 'ADMIN' : 'STUDENT',
          status: 'VERIFIED',
          profile: {
            create: {
              fullName,
              studentCode: `GG${Math.floor(100000 + Math.random() * 900000)}`,
              universityId: university.id,
              avatarUrl: avatarUrl || null,
            },
          },
        },
        include: {
          profile: true,
        },
      });
    } else {
      const updateData: { role?: 'ADMIN' } = {};
      if (isGoogleAdmin && user.role !== 'ADMIN') {
        updateData.role = 'ADMIN';
      }

      const profileUpdate: { avatarUrl?: string } = {};
      if (avatarUrl) {
        profileUpdate.avatarUrl = avatarUrl;
      }

      if (Object.keys(updateData).length > 0 || Object.keys(profileUpdate).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...updateData,
            ...(Object.keys(profileUpdate).length > 0
              ? {
                  profile: {
                    update: profileUpdate,
                  },
                }
              : {}),
          },
          include: { profile: true },
        });
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.profile?.fullName || user.email.split('@')[0],
      avatarUrl: user.profile?.avatarUrl || null,
    };
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new Error('GOOGLE_DB_UNAVAILABLE');
    }
    throw error;
  }
}
