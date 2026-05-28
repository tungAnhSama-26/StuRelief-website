import { z } from 'zod';

/**
 * Cấu hình Môi trường phía Web (Server-side & Client-side).
 */
const envSchema = z.object({
  // DATABASE_URL chỉ được dùng ở Server (Prisma)
  DATABASE_URL: z.string().url(),
  
  // JWT_SECRET chỉ được dùng ở Server (Auth)
  JWT_SECRET: z.string().min(32),
  
  // Các biến có tiền tố NEXT_PUBLIC_ sẽ được expose ra Client
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLOUDINARY_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_ADMIN_EMAIL: z.string().email().default('admin@gmail.com'),
});

const _env = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_ADMIN_EMAIL: process.env.GOOGLE_ADMIN_EMAIL,
});

if (!_env.success) {
  console.error(' Lỗi cấu hình môi trường Web:');
  console.error(_env.error.flatten().fieldErrors);
  throw new Error('Ứng dụng Web không thể khởi động do cấu hình sai tệp web/.env');
}

export const env = _env.data;
