import { ProductStatus, ItemCondition } from '@prisma/client';

export const products = [
  { name: 'Macbook Air M1', price: 15000000, cat: 'electronics', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Laptop Dell Latitude', price: 4500000, cat: 'electronics', condition: ItemCondition.USED_FAIR, rescue: true },
  { name: 'iPhone 12 64GB', price: 8000000, cat: 'electronics', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Bàn phím Logitech', price: 350000, cat: 'electronics', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Chuột Gaming Razer', price: 400000, cat: 'electronics', condition: ItemCondition.USED_FAIR, rescue: false },
  { name: 'Giáo trình Giải tích 1', price: 40000, cat: 'books', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Combo Sách tiếng Anh', price: 150000, cat: 'books', condition: ItemCondition.USED_FAIR, rescue: false },
  { name: 'Truyện tranh One Piece full', price: 500000, cat: 'books', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Áo khoác dù Nam', price: 120000, cat: 'mens-fashion', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Giày Sneaker Nike', price: 600000, cat: 'footwear', condition: ItemCondition.USED_FAIR, rescue: false },
  { name: 'Váy công sở Nữ', price: 200000, cat: 'womens-fashion', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Ấm siêu tốc 1.8L', price: 90000, cat: 'home-appliances', condition: ItemCondition.USED_FAIR, rescue: true },
  { name: 'Nồi cơm điện mini', price: 250000, cat: 'home-appliances', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Xe đạp địa hình', price: 1200000, cat: 'vehicles', condition: ItemCondition.USED_POOR, rescue: true },
  { name: 'Đàn Guitar Acoustic', price: 800000, cat: 'musical-instruments', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Combo Mỹ phẩm dưỡng da', price: 300000, cat: 'cosmetics', condition: ItemCondition.USED_GOOD, rescue: false },
  { name: 'Túi ngủ sinh viên', price: 100000, cat: 'others', condition: ItemCondition.USED_GOOD, rescue: false },
];
