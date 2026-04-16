# 📱 StuRelief - Ứng dụng Mobile

Tài liệu này mô tả chi tiết về ứng dụng Mobile StuRelief, được xây dựng trên nền tảng Expo và React Native.

## 🚀 Công nghệ sử dụng
- **Framework**: React Native (Expo).
- **Navigation**: Expo Router (File-based routing).
- **Styling**: React Native Stylesheet (Vanilla CSS approach).
- **Animations**: React Native Reanimated.
- **Data Fetching**: React Query (TanStack Query).

## 🏗️ Cấu trúc thư mục (`/mobile`)
Dự án mobile tuân thủ mô hình **Thin Client** (Giao diện mỏng): Toàn bộ logic nghiệp vụ được dồn về Next.js Backend. Mobile chỉ tập trung vào hiển thị và tương tác.

```text
mobile/
├── src/
│   ├── app/                # Expo Router entries (Màn hình & Routing)
│   ├── infrastructure/     # API Clients (Gọi Next.js Backend) & Storage
│   └── presentation/       # Tầng hiển thị (Trọng tâm)
│       ├── components/     # UI Components (Atoms, Molecules)
│       ├── hooks/          # UI Logic & Navigation Flow (Custom hooks)
│       ├── assets/         # Images, fonts, icons
│       └── theme/          # Màu sắc, font chữ, styling chuẩn
└── app.json                # Cấu hình Expo
```

## ⚙️ Cài đặt & Khởi chạy
1.  Di chuyển vào thư mục mobile: `cd mobile`
2.  Cài đặt dependencies: `npm install`
3.  Cấu hình môi trường: Sao chép `.env.example` thành `.env` bên trong thư mục `mobile/` và điền `EXPO_PUBLIC_API_URL`.
4.  Khởi chạy Expo Go: `npx expo start`
4.  Quét mã QR trên điện thoại hoặc chạy giả lập (iOS/Android) bằng phím `i` hoặc `a`.

## 🎨 Trải nghiệm người dùng (UX Premium)
- **Haptics**: Sử dụng `expo-haptics` để tạo rung phản hồi khi tương tác.
- **Animations**: Mọi chuyển động phải mượt mà đạt mức 60fps.
- **Offline First**: Hỗ trợ lưu cache dữ liệu để người dùng có thể xem lại khi mất mạng.

## 🛠️ Phát triển mới
Khi thêm một tính năng mới, hãy làm theo quy trình:
1. Định nghĩa Entity trong `domain`.
2. Viết Use Case trong `application`.
3. Implement API/Storage trong `infrastructure`.
4. Gắn vào UI trong `presentation/app`.
