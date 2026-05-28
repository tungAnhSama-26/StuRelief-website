/**
 * Trả về JWT token từ cookie.
 * Ưu tiên admin_token trước, nếu không có thì dùng token thường.
 * Không dùng referer vì không đáng tin cậy (Google OAuth redirect không gửi referer).
 */
export function getAuthToken(cookieStore: any, _request?: Request): string | undefined {
  // Ưu tiên admin_token (dành cho quản trị viên)
  const adminToken = cookieStore.get('admin_token')?.value;
  if (adminToken) return adminToken;

  // Fallback: token thường (dành cho sinh viên)
  return cookieStore.get('token')?.value;
}
