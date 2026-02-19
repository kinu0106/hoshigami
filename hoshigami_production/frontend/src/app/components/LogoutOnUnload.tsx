"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export default function LogoutOnUnload() {
  const pathname = usePathname();
  const isNavigatingRef = useRef(false);

  // pathnameが変更されたとき、遷移中フラグを設定
  // ただし、初回レンダリング時は設定しない（タブを閉じたときと区別するため）
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // ログイン画面以外では、ページ遷移中フラグを設定
    if (pathname !== '/login') {
      isNavigatingRef.current = true;
      const timer = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    // ログイン画面ではログアウトしない
    if (pathname === '/login') {
      return;
    }

    // ページ遷移を検知するためのフラグ
    // Next.jsのリンククリックやrouter.pushを検知
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && !link.target && !link.hasAttribute('download')) {
        // 内部リンクのクリックを検知
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          isNavigatingRef.current = true;
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 2000);
        }
      }
    };

    // ログアウトリクエストを送信する関数
    const sendLogoutRequest = () => {
      const url = `${API_BASE}/api/auth/logout`;
      const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          credentials: 'include',
          keepalive: true,
          body: blob,
        }).catch(() => {
          // エラーは無視（ページが閉じられるため）
        });
      }
    };

    // beforeunloadイベント: タブを閉じる時とリロード時の両方で発火
    const handleBeforeUnload = () => {
      // ページ遷移中（Next.jsの内部遷移）の場合はログアウトしない
      if (isNavigatingRef.current) {
        return;
      }

      // タブを閉じる場合またはリロードの場合にログアウト
      sendLogoutRequest();
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}

