# 🏛️ StuRelief - Tổng Quan Hệ Thống

Chào mừng bạn đến với tài liệu tổng quát của dự án **StuRelief**. Đây là một hệ thống hỗ trợ sinh viên toàn diện, được xây dựng với kiến trúc hiện đại, khả năng mở rộng cao và trải nghiệm người dùng tối ưu.

## 🚀 Tầm nhìn dự án
StuRelief không chỉ là một ứng dụng, mà là một hệ sinh thái hỗ trợ đời sống sinh viên, từ quản lý tài chính, hóa đơn đến các tiện ích học tập.

## 🏗️ Kiến trúc lõi (Core Architecture)

Dự án áp dụng chặt chẽ **Clean Architecture** (Kiến trúc sạch) trên toàn bộ các nền tảng (Web & Mobile). Điều này cho phép logic nghiệp vụ hoàn toàn độc lập với các yếu tố hạ tầng (Database, Framework).

### Các lớp cấu trúc:
1.  **Domain (Lõi)**: Chứa các thực thể (Entities) và Interface của Repository. Đây là nơi chứa quy tắc nghiệp vụ quan trọng nhất.
2.  **Application (Use Cases)**: Chứa luồng xử lý nghiệp vụ của chương trình. Logic ở đây là "thuần khiết", không phụ thuộc vào Web hay Mobile.
3.  **Infrastructure**: Thực hiện các chi tiết kỹ thuật như gọi API, truy vấn Cơ sở dữ liệu (Prisma, Postgres).
4.  **Presentation**: Tầng hiển thị (Next.js cho Web và React Native cho Mobile).

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend Web** | Next.js 15+, TailwindCSS, Prisma |
| **Mobile App** | React Native (Expo), Expo Router |
| **Ngôn ngữ** | TypeScript (Strict Mode) |
| **Cơ sở dữ liệu** | PostgreSQL |
| **Quản lý AI** | Antigravity Agents (.agent skills) |

## 📁 Cấu trúc thư mục gốc
- `/web`: Mã nguồn ứng dụng Web (Next.js).
- `/mobile`: Mã nguồn ứng dụng Mobile (React Native).
- `/docs`: Tài liệu hướng dẫn chi tiết.
- `/.agent`: Bộ kỹ năng chuyên sâu dành cho AI Agent.
- `/docker`: Cấu hình container cho các dịch vụ.

## 📖 Tài liệu chi tiết
- [Tài liệu ứng dụng Web](./WEB.md)
- [Tài liệu ứng dụng Mobile](./MOBILE.md)
- [Hướng dẫn Commit chuẩn](./../.agent/commit/SKILL.md)

---
*Dự án được duy trì và phát triển với sự hỗ trợ của Antigravity Agent.*
