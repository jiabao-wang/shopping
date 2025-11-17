// utils/orderUtils.ts (更新：添加每日订单限制检查)
'use client';

// import type { CreateOrderInput } from '../types'; // 假设类型定义

// 保存用户信息到 localStorage
export function saveUserInfo(info: { customerName: string; customerPhone: string; address: string }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userShippingInfo', JSON.stringify(info));
  }
}

// 保存订单历史到 localStorage
export function saveOrderHistory(order: any) {
  if (typeof window !== 'undefined') {
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    history.unshift(order); // 添加到开头（最新订单在前）
    localStorage.setItem('orderHistory', JSON.stringify(history));
  }
}

// 获取用户信息从 localStorage
export function getUserInfo() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('userShippingInfo');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
}

// 获取订单历史从 localStorage
export function getOrderHistory() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('orderHistory');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
}

// 清除所有本地缓存
export function clearLocalCache() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userShippingInfo');
    localStorage.removeItem('orderHistory');
    localStorage.removeItem('dailyOrderCount');
  }
}

// 检查每日订单限制（每个设备每天最多10单）
export function checkDailyOrderLimit(): { canOrder: boolean; remaining: number; message?: string } {
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = localStorage.getItem('dailyOrderCount');
    const dailyCount = stored ? JSON.parse(stored) : {};

    const todayCount = dailyCount[today] || 0;
    const maxOrders = 10;
    const remaining = maxOrders - todayCount;

    if (todayCount >= maxOrders) {
      return { canOrder: false, remaining: 0, message: `今日订单已达上限（${maxOrders}单），请明天再试。` };
    }

    return { canOrder: true, remaining };
  }
  return { canOrder: true, remaining: 10 };
}

// 更新每日订单计数
export function incrementDailyOrderCount() {
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = localStorage.getItem('dailyOrderCount');
    const dailyCount = stored ? JSON.parse(stored) : {};

    dailyCount[today] = (dailyCount[today] || 0) + 1;
    localStorage.setItem('dailyOrderCount', JSON.stringify(dailyCount));
  }
}