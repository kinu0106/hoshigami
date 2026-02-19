"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiRequest } from '../../lib/apiClient';

type AuthState = 'unknown' | 'loggedIn' | 'loggedOut';

export default function AuthLinks({ className = '' }: { className?: string }) {
  const [authState, setAuthState] = useState<AuthState>('unknown');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') {
      setAuthState('loggedOut');
      return;
    }
    apiRequest('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          setAuthState('loggedOut');
          return;
        }
        const data = await res.json();
        setAuthState(data?.isAdmin ? 'loggedIn' : 'loggedOut');
      })
      .catch(() => setAuthState('loggedOut'));
  }, [pathname]);

  async function handleLogout() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('ログアウトエラー:', err);
    } finally {
      setAuthState('loggedOut');
      if (pathname.startsWith('/login')) {
        router.refresh();
      } else {
        router.push('/login');
      }
    }
  }

  if (authState === 'unknown') {
    return null;
  }

  const isLoggedIn = authState === 'loggedIn';

  function handleClick() {
    if (isLoggedIn) {
      handleLogout();
    } else {
      router.push('/login');
    }
  }

  const buttonClass = isLoggedIn ? 'btn btn-logout' : 'btn btn-outline-primary';
  const buttonLabel = isLoggedIn ? 'ログアウト' : 'ログイン';

  return (
    <div className={`auth-links mt-3 ${className}`}>
      <button type="button" className={buttonClass} onClick={handleClick}>
        {buttonLabel}
      </button>
    </div>
  );
}


