---
name: visual-identity-standards
description: Skill này áp buộc việc sử dụng hệ thống Icon chuyên nghiệp (Tailwind-compatible) thay vì sử dụng Emoji trong logs hoặc giao diện. Đảm bảo tính thẩm mỹ cao cấp (Premium) cho dự án StuRelief.
risk: low
source: community
---

# Visual Identity & Iconography Standards

Skill này đảm bảo tính nhất quán về mặt thị giác và phong cách thiết kế hiện đại, cao cấp cho toàn bộ dự án.

## Quy tắc nghiêm ngặt về Icon

1.  **Cấm sử dụng Emoji**: Tuyệt đối KHÔNG sử dụng các Emoji như 🏛️, 🧹, 📂, 🌱, ✅ trong mã nguồn (đặc biệt là trong UI, Logs hệ thống hoặc các thông báo người dùng). Emoji làm giảm tính chuyên nghiệp của sản phẩm doanh nghiệp.
2.  **Bắt buộc sử dụng Lucide React**: Toàn bộ Icon phải được lấy từ thư viện **Lucide React** (phù hợp hoàn hảo với hệ sinh thái Tailwind CSS).

## Cách triển khai

**🚫 KHÔNG NÊN (Sử dụng Emoji):**
```typescript
console.log('🌱 Đang bắt đầu quá trình Seed...');
```

**✅ NÊN (Sử dụng CSS hoặc Unicode symbols ẩn trong Logs):**
Sử dụng các ký tự đơn giản hoặc text thuần túy trong logs, và sử dụng Lucide Component trong UI.

### Ví dụ trong React/Next.js:
```tsx
import { Database, Trash2, FolderOpen } from 'lucide-react';

export const StatusCard = () => (
  <div className="flex items-center gap-2 text-slate-700">
    <Database className="w-4 h-4 text-blue-500" />
    <span>Hệ thống dữ liệu đã sẵn sàng</span>
  </div>
);
```

## Checklist Tuân thủ
- [ ] Đã xóa bỏ toàn bộ Emoji 🏛️, 🧹, 📂 khỏi UI và Logs?
- [ ] Đã cài đặt và sử dụng `lucide-react` cho toàn bộ các biểu tượng chưa?
- [ ] Màu sắc của Icon có tuân theo bảng màu của Tailwind không? (ví dụ: `text-blue-600`)

---
> [!IMPORTANT]
> Sự khác biệt giữa một ứng dụng "đồ án" và một ứng dụng "enterprise" nằm ở sự tỉ mỉ trong việc chọn Icon. Phối hợp Icon với Tailwind giúp giao diện đồng nhất và sạch sẽ.
