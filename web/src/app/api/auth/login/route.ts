import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/crypto';
import { signToken } from '@/lib/jwt';
import { env } from '@/infrastructure/config/env';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp đầy đủ email và mật khẩu!' },
        { status: 400 }
      );
    }

    // 1. Tìm User cùng với profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Tài khoản hoặc mật khẩu không chính xác!' },
        { status: 400 }
      );
    }

    // 2. Xác thực mật khẩu
    let isMatch = false;
    
    // Hỗ trợ cả mật khẩu chưa mã hóa (từ seed) và mật khẩu đã mã hóa PBKDF2
    if (user.password.includes(':')) {
      isMatch = verifyPassword(password, user.password);
    } else {
      // Hỗ trợ kiểm tra thô cho tài khoản seed chưa mã hóa
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return NextResponse.json(
        { message: 'Tài khoản hoặc mật khẩu không chính xác!' },
        { status: 400 }
      );
    }

    // 3. Ký JWT Token HS256 chuẩn
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.profile?.fullName || 'Người dùng',
      avatarUrl: user.profile?.avatarUrl || null,
    };

    const token = signToken(userData, env.JWT_SECRET, 86400);

    // 4. Thiết lập HTTP-only cookie theo phiên trình duyệt
    const cookieStore = await cookies();
    const cookieName = user.role === 'ADMIN' ? 'admin_token' : 'token';
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400, // 1 ngày
    });

    return NextResponse.json({
      message: 'Đăng nhập thành công!',
      user: userData,
      token: token, // Thêm token cho bản Mobile có thể lấy được
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return NextResponse.json(
      { message: 'Đã có lỗi xảy ra ở phía máy chủ!' },
      { status: 500 }
    );
  }
}
