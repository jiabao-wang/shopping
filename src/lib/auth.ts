// utils/auth.ts
'use client';

import { useRouter } from 'next/navigation';

// 用户信息接口（基于后端返回）
interface UserInfo {
  id: string;
  username: string;
  name: string | null;  // ← 改成允许 null
  role: string;
}

// 存储用户信息到 localStorage
export function storeUser(user: UserInfo): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminUser', JSON.stringify(user));
  }
}

// 获取用户信息从 localStorage
export function getUser(): UserInfo | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('adminUser');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return getUser() !== null;
}

// 登出：清除 localStorage 并可选跳转
export function logout(): boolean {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminUser');
    return true;
  }
  return false;

}

// Hook：用于组件中检查登录并重定向（如果未登录）
import { useEffect } from 'react';

export function useAuthGuard(redirectTo: string = '/admin/login'): void {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);
}