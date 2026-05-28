import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    cookieStore.delete('admin_token');
    
    return NextResponse.json({
      message: 'Đăng xuất thành công!',
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Đã có lỗi xảy ra khi đăng xuất!' },
      { status: 500 }
    );
  }
}
