import { z } from 'zod';

/**
 * Cấu hình Môi trường phía Mobile (React Native/Expo).
 * Tuyệt đối KHÔNG chứa DATABASE_URL hay JWT_SECRET ở đây.
 */
const envSchema = z.object({
  // Các biến Expo bắt buộc phải bắt đầu bằng EXPO_PUBLIC_ để được nhận diện
  EXPO_PUBLIC_API_URL: z.string().url("EXPO_PUBLIC_API_URL phải là URL hợp lệ"),
  
  // Cấu hình Cloudinary (Public Cloud Name)
  EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Lỗi cấu hình môi trường Mobile:');
  console.error(_env.error.flatten().fieldErrors);
  throw new Error('Ứng dụng Mobile thiếu cấu hình bắt buộc trong mobile/.env');
}

export const env = _env.data;
