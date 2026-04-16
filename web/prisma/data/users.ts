import { UserRole, UserStatus } from '@prisma/client';

export const users = [
  { email: 'admin@sturelief.vn', password: 'password', role: UserRole.ADMIN, status: UserStatus.VERIFIED, fullName: 'Admin System', studentCode: 'ADM001', universityId: 'DHQG_HCM' },
  { email: 'mod@sturelief.vn', password: 'password', role: UserRole.MODERATOR, status: UserStatus.VERIFIED, fullName: 'Moderator One', studentCode: 'MOD001', universityId: 'DHQG_HCM' },
  ...Array.from({ length: 13 }).map((_, i) => ({
    email: `student${i + 1}@edu.vn`,
    password: 'password123',
    role: UserRole.STUDENT,
    status: UserStatus.VERIFIED,
    fullName: `Sinh viên ${i + 1}`,
    studentCode: `SV202400${i + 1}`,
    universityId: i % 2 === 0 ? 'DHQG_HCM' : 'UEH',
  }))
];
