import { PrismaClient, OrderStatus } from '@prisma/client';
import { universities } from './data/universities';
import { categories } from './data/categories';
import { users } from './data/users';
import { products } from './data/products';

const prisma = new PrismaClient();

async function main() {
  console.log('[SYSTEM] Bắt đầu quá trình nạp dữ liệu hệ thống (Unified Data Platform)...');

  // 1. CLEAR DỮ LIỆU CŨ (Để tránh trùng lặp khi chạy lại)
  console.log('[CLEANUP] Đang làm sạch dữ liệu cũ...');
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productMedia.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.university.deleteMany({});

  // 2. UNIVERSITIES (5+)
  console.log('[DATA] Seeding Universities...');
  for (const uni of universities) {
    await prisma.university.create({
      data: {
        id: uni.id,
        name: uni.name,
        domain: uni.domain,
        campuses: { create: uni.campuses.map(name => ({ name })) },
      },
    });
  }

  // 3. CATEGORIES (15)
  console.log('[DATA] Seeding Categories...');
  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    categoryIds[cat.slug] = created.id;
  }

  // 4. USERS (15)
  console.log('[DATA] Seeding Users...');
  const userIds: string[] = [];
  for (const u of users) {
    const created = await prisma.user.create({
      data: {
        email: u.email,
        password: u.password,
        role: u.role,
        status: u.status,
        profile: {
          create: {
            fullName: u.fullName,
            studentCode: u.studentCode,
            universityId: u.universityId,
          },
        },
      },
    });
    userIds.push(created.id);
  }

  // 5. PRODUCTS (15+)
  console.log('[DATA] Seeding Products...');
  const productIds: string[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const created = await prisma.product.create({
      data: {
        name: p.name,
        description: `Mô tả chi tiết cho ${p.name}. Sản phẩm chất lượng cao dành cho sinh viên.`,
        currentPrice: p.price,
        status: 'AVAILABLE',
        condition: p.condition,
        sellerId: userIds[i % userIds.length],
        categoryId: categoryIds[p.cat] || categoryIds['others'],
        media: { create: { url: 'https://via.placeholder.com/400x300', isPrimary: true } },
      },
    });
    productIds.push(created.id);
  }

  // 6. ORDERS (5+)
  console.log('[DATA] Seeding Orders...');
  for (let i = 0; i < 7; i++) {
    await prisma.order.create({
      data: {
        productId: productIds[i],
        buyerId: userIds[(i + 5) % userIds.length],
        sellerId: userIds[i % userIds.length],
        finalPrice: 100000,
        status: OrderStatus.SUCCESS,
      },
    });
  }


  // 7. NOTIFICATIONS (5+)
  console.log('[DATA] Seeding Notifications...');
  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        userId: userIds[i % userIds.length],
        title: 'Thông báo mới',
        content: `Bạn có một cập nhật mới về sản phẩm số ${i}`,
      },
    });
  }

  // 8. CONVERSATIONS (5+)
  console.log('[DATA] Seeding Messages...');
  for (let i = 0; i < 5; i++) {
    await prisma.conversation.create({
      data: {
        title: `Hội thoại ${i}`,
        members: {
          create: [
            { userId: userIds[0] },
            { userId: userIds[i + 1] },
          ],
        },
        messages: {
          create: [
            { senderId: userIds[0], content: 'Chào bạn, sản phẩm còn không?' },
            { senderId: userIds[i + 1], content: 'Còn bạn ơi!' },
          ],
        },
      },
    });
  }

  console.log('[SUCCESS] Đã nạp xong 15+ record cho bảng chính và 5+ record cho các bảng phụ!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
