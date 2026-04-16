---
name: environment-security
description: Skill này đảm bảo tuyệt đối an toàn cho các biến môi trường và thông tin nhạy cảm. Ép buộc sử dụng ConfigService/env.ts thay vì truy cập process.env trực tiếp và ngăn chặn việc hardcode bí mật vào mã nguồn.
risk: low
source: community
---

# Environment Security & Fail-Safe Config

Skill này bảo vệ dự án khỏi các lỗi lọt thông tin nhạy cảm (Security Leak) và đảm bảo ứng dụng luôn chạy với cấu hình hợp lệ.

## Khi nào sử dụng
- Khi cần truy cập các giá trị như API Key, Database URL, Secret Key.
- Khi thêm một biến môi trường mới vào hệ thống.
- Khi kiểm tra tính an toàn của mã nguồn trước khi commit.

## Nguyên tắc bảo mật

1.  **KHÔNG Hardcode**: Cấm tuyệt đối việc viết chết các chuỗi bí mật (Secret strings) vào code.
2.  **KHÔNG sử dụng trực tiếp `process.env`**: Luôn phải gọi thông qua `env.ts` (ở lớp Infrastructure) để tận dụng cơ chế xác thực của Zod.
3.  **Hợp đồng Môi trường (Environment Contract)**: Mọi biến môi trường mới phải được đăng ký trong tệp `src/infrastructure/config/env.ts`.

## Quy trình thêm Biến môi trường mới

1.  Mở `src/infrastructure/config/env.ts`.
2.  Thêm định nghĩa cho biến mới trong `envSchema` kèm theo các ràng buộc (ví dụ: `.url()`, `.min()`).
3.  Cập nhật tệp mẫu `.env.example` để đồng bộ.
4.  Sử dụng trong code bằng cách:
    ```typescript
    import { env } from '@/infrastructure/config/env';
    const apiKey = env.MY_NEW_API_KEY; // Type-safe và đã được validate
    ```

## Checklist An toàn
- [ ] Biến môi trường này đã được đăng ký trong Schema chưa?
- [ ] Có đoạn code nào đang gọi `process.env` trực tiếp không? (Nếu có -> Refactor ngay).
- [ ] Đã cập nhật `.env.example` chưa?
- [ ] Có dữ liệu nhạy cảm nào vô tình bị commit không?
