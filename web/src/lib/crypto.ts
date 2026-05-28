import crypto from 'crypto';

/**
 * Mã hóa mật khẩu sử dụng thuật toán PBKDF2 (chuẩn công nghiệp) cực kỳ bảo mật và không phụ thuộc thư viện ngoài.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Kiểm tra xem mật khẩu có khớp với chuỗi đã mã hóa hay không.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  const parts = storedValue.split(':');
  if (parts.length !== 2) return false;
  
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}
