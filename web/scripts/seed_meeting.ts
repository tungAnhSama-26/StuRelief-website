import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campus = await prisma.campus.findFirst({
    where: {
      university: {
        name: { contains: 'Bách Khoa' }
      }
    }
  });

  const targetCampusId = campus ? campus.id : (await prisma.campus.findFirst())?.id;

  if (!targetCampusId) {
    console.log("Không tìm thấy campus nào trong DB.");
    return;
  }

  const points = [
    {
      name: "Sảnh Thư viện Tạ Quang Bửu",
      description: "Khu vực sảnh lớn, có bảo vệ và camera an ninh 24/7. Rất đông sinh viên qua lại.",
      isSafeZone: true,
      campusId: targetCampusId,
      photoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "Khu vực canteen D6",
      description: "Đông đúc vào giờ trưa, không gian mở, dễ dàng nhận diện nhau.",
      isSafeZone: true,
      campusId: targetCampusId,
      photoUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop"
    }
  ];

  for (const p of points) {
    await prisma.meetingPoint.create({ data: p });
    console.log("Đã tạo:", p.name);
  }
}

main().catch(console.error);
