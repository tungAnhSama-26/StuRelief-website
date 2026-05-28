import { PrismaClient, OrderStatus } from '@prisma/client';
import { universities } from './data/universities';
import { categories } from './data/categories';
import { users } from './data/users';
import { products } from './data/products';
import { aiImageUrl } from '../src/lib/aiImage';

const prisma = new PrismaClient();

async function main() {
  console.log('[SYSTEM] Bắt đầu quá trình nạp dữ liệu hệ thống (Unified Data Platform)...');

  // 1. CLEAR DỮ LIỆU CŨ (Để tránh trùng lặp khi chạy lại)
  console.log('[CLEANUP] Đang làm sạch dữ liệu cũ...');
  await prisma.disputeEvidence.deleteMany({});
  await prisma.disputeCase.deleteMany({});
  await prisma.reviewAttribute.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.reputationRecord.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.escrowSession.deleteMany({});
  await prisma.orderEvidence.deleteMany({});
  await prisma.orderStatusLog.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productReservation.deleteMany({});
  await prisma.productSnapshot.deleteMany({});
  await prisma.productMedia.deleteMany({});
  await prisma.productAttribute.deleteMany({});
  await prisma.priceHistory.deleteMany({});
  await prisma.tradeOffer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.categoryAttributeTemplate.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.verificationRequest.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.userTrustNetwork.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.meetingPoint.deleteMany({});
  await prisma.campus.deleteMany({});
  await prisma.university.deleteMany({});

  // 2. UNIVERSITIES (5+)
  console.log('[DATA] Seeding Universities...');
  for (const uni of universities) {
    await prisma.university.create({
      data: {
        id: uni.id,
        name: uni.name,
        emailDomains: [uni.domain],
        campuses: { create: uni.campuses.map(name => ({ name })) },
      },
    });
  }

  // 3. CATEGORIES (15)
  console.log('[DATA] Seeding Categories...');
  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
      },
    });
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
        media: {
          create: {
            url: aiImageUrl(
              `realistic AI marketplace product photo of ${p.name}, student resale listing, clean studio background, natural light`,
              { width: 400, height: 300, seed: `seed-${p.cat}-${i}` }
            ),
            isPrimary: true,
          },
        },
      },
    });
    productIds.push(created.id);
  }

  // 6. ORDERS (5+)
  console.log('[DATA] Seeding Orders & Disputes...');
  
  // Seed normal success orders
  const successOrders = [];
  for (let i = 0; i < 5; i++) {
    const o = await prisma.order.create({
      data: {
        productId: productIds[i],
        buyerId: userIds[(i + 2) % userIds.length],
        sellerId: userIds[i % userIds.length],
        finalPrice: 100000,
        status: OrderStatus.SUCCESS,
      },
    });
    successOrders.push(o);
  }

  // Seed reviews and reputation
  console.log('[DATA] Seeding Reviews & Reputation...');
  const reviewComments = [
    'Sản phẩm rất tốt, đúng như mô tả, đóng gói cẩn thận!',
    'Giao dịch nhanh chóng tại Điểm hẹn an toàn, người bán nhiệt tình.',
    'Máy chạy mượt mà, tuy nhiên hơi bám vân tay một chút.',
    'Giá cả rất sinh viên, chất lượng ngoài mong đợi.',
    'Dùng ổn định, hỗ trợ cài đặt phần mềm rất chu đáo!'
  ];

  for (let i = 0; i < successOrders.length; i++) {
    const order = successOrders[i];
    await prisma.review.create({
      data: {
        orderId: order.id,
        reviewerId: order.buyerId,
        reviewedId: order.sellerId,
        rating: 5 - (i % 2), // 5, 4, 5, 4, 5 stars
        body: reviewComments[i]
      }
    });

    await prisma.reputationRecord.create({
      data: {
        userId: order.sellerId,
        delta: 10,
        actionType: 'TRANSACTION_SUCCESS',
        referenceId: order.id,
        note: `Hoàn tất giao dịch thành công mã đơn #${order.id}`
      }
    });

    await prisma.reputationRecord.create({
      data: {
        userId: order.sellerId,
        delta: 5,
        actionType: 'REPUTABLE_FEEDBACK',
        referenceId: order.id,
        note: `Nhận đánh giá tích cực từ giao dịch mã đơn #${order.id}`
      }
    });

    await prisma.user.update({
      where: { id: order.sellerId },
      data: {
        reputationScore: {
          increment: 15
        }
      }
    });
  }

  // Seed custom products for disputes
  const buyerId = userIds[2]; // student1
  const sellerId = userIds[3]; // student2

  const disputeProduct1 = await prisma.product.create({
    data: {
      name: 'Laptop Dell XPS 13 9310',
      description: 'Máy mỏng nhẹ, pin tốt, RAM 8GB. Thích hợp văn phòng.',
      currentPrice: 12500000,
      status: 'RESERVED',
      condition: 'USED_GOOD',
      sellerId: sellerId,
      categoryId: categoryIds['others'] || Object.values(categoryIds)[0],
      media: {
        create: {
          url: aiImageUrl(
            'realistic AI photo of a Dell XPS 13 laptop on a desk, premium student marketplace product photo, clean lighting',
            { width: 400, height: 300, seed: 'dispute-dell-xps-13' }
          ),
          isPrimary: true,
        },
      },
    }
  });

  // Original product snapshot (16GB RAM before seller changed it)
  await prisma.productSnapshot.create({
    data: {
      productId: disputeProduct1.id,
      versionName: 'ORIGINAL_DEAL',
      data: {
        name: 'Laptop Dell XPS 13 9310 (Mô tả gốc lúc mua)',
        price: 12500000,
        description: 'Dell XPS cấu hình cực mạnh, RAM 16GB thoải mái code và thiết kế đồ họa.',
        condition: 'USED_LIKE_NEW',
        ram: '16GB',
        cpu: 'Intel Core i7'
      }
    }
  });

  const disputeOrder1 = await prisma.order.create({
    data: {
      productId: disputeProduct1.id,
      buyerId: buyerId,
      sellerId: sellerId,
      finalPrice: 12500000,
      status: OrderStatus.DISPUTED,
      paymentType: 'ESCROW'
    }
  });

  const disputeCase1 = await prisma.disputeCase.create({
    data: {
      orderId: disputeOrder1.id,
      initiatorId: buyerId,
      reason: 'Người bán tự ý thay đổi RAM từ 16GB xuống 8GB sau khi tôi đặt cọc giữ chỗ và tráo linh kiện khi bàn giao.',
      status: 'PENDING'
    }
  });

  await prisma.disputeEvidence.create({
    data: {
      disputeCaseId: disputeCase1.id,
      url: aiImageUrl(
        'realistic AI documentary photo of a laptop system settings screen showing 8GB RAM, evidence photo, believable on-screen text',
        { width: 400, height: 300, seed: 'dispute-evidence-8gb' }
      ),
      description: 'Ảnh chụp cấu hình máy thực tế hiển thị trong phần Settings chỉ có 8GB RAM.'
    }
  });

  // Second Dispute Case (Investigating)
  const buyerId2 = userIds[4];
  const sellerId2 = userIds[5];

  const disputeProduct2 = await prisma.product.create({
    data: {
      name: 'iPad Air 4 Wifi 64GB',
      description: 'Máy dùng tốt mượt mà. (Có nứt nhẹ kính góc)',
      currentPrice: 7900000,
      status: 'RESERVED',
      condition: 'USED_FAIR',
      sellerId: sellerId2,
      categoryId: categoryIds['others'] || Object.values(categoryIds)[0],
      media: {
        create: {
          url: aiImageUrl(
            'realistic AI photo of an iPad Air 4 on a desk with a visible cracked corner screen, student resale listing, documentary style',
            { width: 400, height: 300, seed: 'dispute-ipad-air-4' }
          ),
          isPrimary: true,
        },
      },
    }
  });

  await prisma.productSnapshot.create({
    data: {
      productId: disputeProduct2.id,
      versionName: 'ORIGINAL_DEAL',
      data: {
        name: 'iPad Air 4 Wifi 64GB',
        price: 7900000,
        description: 'iPad đẹp keng 99%, không xước sát, không cấn móp, đầy đủ sạc cáp zin.',
        condition: 'USED_LIKE_NEW'
      }
    }
  });

  const disputeOrder2 = await prisma.order.create({
    data: {
      productId: disputeProduct2.id,
      buyerId: buyerId2,
      sellerId: sellerId2,
      finalPrice: 7900000,
      status: OrderStatus.DISPUTED,
      paymentType: 'ESCROW'
    }
  });

  const disputeCase2 = await prisma.disputeCase.create({
    data: {
      orderId: disputeOrder2.id,
      initiatorId: buyerId2,
      reason: 'Sản phẩm nhận được bị nứt góc màn hình lớn nhưng mô tả tin đăng ghi không trầy xước.',
      status: 'INVESTIGATING'
    }
  });

  await prisma.disputeEvidence.create({
    data: {
      disputeCaseId: disputeCase2.id,
      url: aiImageUrl(
        'realistic AI close-up photo of an iPad screen corner with a visible crack, evidence photo for dispute review',
        { width: 400, height: 300, seed: 'dispute-evidence-ipad-crack' }
      ),
      description: 'Ảnh chụp màn hình iPad bị nứt kính sâu ở góc phải.'
    }
  });

  // 7. ACTIVITY LOGS (Security & Audit)
  console.log('[DATA] Seeding Security Logs...');
  const now = Date.now();
  await prisma.activityLog.create({
    data: {
      userId: userIds[5],
      action: 'CHANGE_PRICE',
      targetType: 'PRODUCT',
      targetId: productIds[5],
      metadata: {
        severity: 'WARNING',
        actionLabel: 'THAY ĐỔI GIÁ ĐỘT NGỘT',
        userEmail: 'dat.nv2199@sis.hust.edu.vn',
        details: 'Sản phẩm "Giáo trình Giải tích 1" giảm giá đột ngột 95% từ 100k còn 5k (Dấu hiệu giao dịch ảo nhằm tăng điểm uy tín sinh viên)',
      },
      createdAt: new Date(now - 3 * 60 * 1000),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: userIds[1],
      action: 'VERIFICATION_REQUEST',
      targetType: 'VERIFICATION',
      metadata: {
        severity: 'INFO',
        actionLabel: 'XÁC THỰC THÀNH VIÊN',
        userEmail: 'quan.tm2245@sis.hust.edu.vn',
        details: 'Tải lên ảnh thẻ sinh viên và nhập email trường yêu cầu duyệt quyền truy cập.',
      },
      createdAt: new Date(now - 10 * 60 * 1000),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: sellerId,
      action: 'SUSPICIOUS_EDIT',
      targetType: 'PRODUCT',
      targetId: disputeProduct1.id,
      metadata: {
        severity: 'CRITICAL',
        actionLabel: 'SỬA TIN MÔ TẢ ĐANG GIAO DỊCH',
        userEmail: 'huy.pd2011@sis.hust.edu.vn',
        details: 'Chỉnh sửa RAM từ 16GB xuống 8GB của sản phẩm "Dell XPS" trong khi đơn hàng ord-8832 đang ở trạng thái Giữ Chỗ.',
      },
      createdAt: new Date(now - 60 * 60 * 1000),
    },
  });


  // 8. NOTIFICATIONS (5+)
  console.log('[DATA] Seeding Notifications...');
  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        userId: userIds[i % userIds.length],
        title: 'Thông báo mới',
        content: `Bạn có một cập nhật mới về sản phẩm số ${i}`,
        type: 'SYSTEM',
      },
    });
  }

  // 9. CONVERSATIONS (5+)
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
