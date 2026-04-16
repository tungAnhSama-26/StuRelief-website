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
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLOUDINARY_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Lỗi cấu hình môi trường Web:');
  console.error(_env.error.flatten().fieldErrors);
  throw new Error('Ứng dụng Web không thể khởi động do cấu hình sai tệp web/.env');
}

export const env = _env.data;
