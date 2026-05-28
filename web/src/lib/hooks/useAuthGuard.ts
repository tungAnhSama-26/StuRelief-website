import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES, API_ROUTES } from '@shared/constants';
import { UserRole } from '@shared/enums';

export function useAuthGuard(requiredRole?: UserRole) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const getLoginRoute = () =>
      requiredRole === UserRole.ADMIN ? APP_ROUTES.ADMIN.LOGIN : APP_ROUTES.LOGIN;

    const checkAuth = async () => {
      try {
        const res = await fetch(API_ROUTES.AUTH.ME);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            if (data.user) {
              if (requiredRole && data.user.role !== requiredRole) {
                router.replace(getLoginRoute());
              } else {
                setCurrentUser(data.user);
              }
            } else {
              router.replace(getLoginRoute());
            }
          }
        } else if (active) {
          router.replace(getLoginRoute());
        }
      } catch (err) {
        console.error('Lỗi kiểm tra quyền truy cập:', err);
        if (active) {
          router.replace(getLoginRoute());
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      active = false;
    };
  }, [router, requiredRole]);

  return { currentUser, loading };
}
