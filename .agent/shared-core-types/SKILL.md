---
name: shared-core-types
description: Skill này quản lý tính nhất quán dữ liệu giữa Web và Mobile bằng cách ép buộc sử dụng các định nghĩa từ thư mục `shared`. Đảm bảo mọi thay đổi về cấu hình dữ liệu được thực hiện tại một nơi duy nhất.
risk: low
source: community
---

# Shared Core & Cross-Platform Types

Skill này giúp dự án StuRelief duy trì sự đồng bộ hoàn hảo giữa Backend (Next.js) và Frontend (Mobile/Web UI).

## Khi nào sử dụng
- Khi định nghĩa các thực thể (Entities) mới liên quan đến Database.
- Khi tạo các DTOs (Data Transfer Objects) cho API responses.
- Khi làm việc với các hằng số (Constants) dùng chung cho cả 2 nền tảng.

## Nguyên tắc đồng bộ

1.  **Single Source of Truth**: Mọi Interface hoặc Enum dùng ở cả 2 nơi PHẢI được định nghĩa trong `d:\StuRelief\shared\src`.
2.  **Sử dụng Alias**: Luôn sử dụng `@shared/...` để import. Cấm việc copy-paste code định nghĩa từ Web sang Mobile hoặc ngược lại.
3.  **Thay đổi tập trung**: Khi cần thêm một trường dữ liệu (ví dụ: `Product.color`), hãy sửa tại `shared/src/domain/entities.ts`. Cả Web và Mobile sẽ tự động nhận diện thay đổi này.

## Quy trình làm việc

1.  Định nghĩa kiểu dữ liệu tại `shared/src`.
2.  Tại Web/Mobile:
    ```typescript
    import { Product, UserStatus } from '@shared/domain/entities';
    ```
3.  Kiểm tra IntelliSense để đảm bảo dữ liệu được nhận diện đúng.

## Checklist Đồng bộ
- [ ] Kiểu dữ liệu này có xuất hiện ở cả Web và Mobile không? (Nếu có -> Đưa vào `shared`).
- [ ] Đã sử dụng `@shared/*` alias để import chưa?
- [ ] Khi thay đổi field trong Prisma, đã cập nhật `shared` entities tương ứng chưa?
