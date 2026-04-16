# 🌐 StuRelief - Ứng dụng Web

Tài liệu này hướng dẫn chi tiết về cấu trúc và cách vận hành của ứng dụng Web trong hệ thống StuRelief.

## 🚀 Công nghệ sử dụng
- **Framework**: Next.js (App Router).
- **Styling**: TailwindCSS & Vanilla CSS.
- **ORM**: Prisma.
- **Database**: PostgreSQL.
- **State Management**: React Context & Hooks.

## 🏗️ Cấu trúc thư mục (`/web`)
```text
web/
├── src/
│   ├── app/            # Next.js App Router (Pages, API Routes)
│   ├── components/     # UI Components (Atomic Design)
│   ├── modules/        # Module-specific logic
│   ├── lib/            # Shared utilities & configurations
│   └── styles/         # Global styles
├── prisma/             # Database schema & migrations
└── public/             # Static assets
```

## ⚙️ Cài đặt & Khởi chạy
1.  Di chuyển vào thư mục web: `cd web`
2.  Cài đặt dependencies: `npm install`
3.  Cấu hình môi trường: Sao chép `.env.example` thành `.env` bên trong thư mục `web/` và điền thông tin.
4.  Đẩy cấu hình database: `npx prisma db push`
5.  Chạy môi trường phát triển: `npm run dev`

## 💎 Tiêu chuẩn Code
- Ưu tiên sử dụng **Server Components** cho các trang tĩnh để tối ưu SEO và hiệu năng.
- Chặt chẽ trong việc định nghĩa **Typescript Types**.
- Toàn bộ các API response phải tuân thủ định dạng xử lý lỗi tập trung.

## 🔒 Bảo mật
- Xác thực thông qua JWT hoặc Session tùy cấu hình.
- Bảo vệ các Route nhạy cảm bằng Middleware.
