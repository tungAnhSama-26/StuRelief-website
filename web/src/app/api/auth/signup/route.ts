import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, studentCode, role = 'STUDENT' } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên!' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra Email xem đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email này đã được đăng ký!' },
        { status: 400 }
      );
    }

    // 2. Mã hóa mật khẩu bảo mật bằng PBKDF2
    const hashedPassword = hashPassword(password);

    // 3. Tìm trường Đại học đầu tiên để liên kết Profile
    let university = await prisma.university.findFirst();
    if (!university) {
      // Đề phòng trường hợp chưa seed
      university = await prisma.university.create({
        data: {
          id: 'DHQG_HCM',
          name: 'Đại học Quốc gia TP.HCM',
          emailDomains: ['vnuhcm.edu.vn'],
        },
      });
    }

    // 4. Tạo User cùng với StudentProfile
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT',
        status: 'UNVERIFIED',
        profile: {
          create: {
            fullName,
            studentCode: studentCode || `SV${Math.floor(100000 + Math.random() * 900000)}`,
            universityId: university.id,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Đăng ký tài khoản thành công!',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.profile?.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    return NextResponse.json(
      { message: 'Đã có lỗi xảy ra ở phía máy chủ!' },
      { status: 500 }
    );
  }
}
