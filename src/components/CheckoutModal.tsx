// components/CheckoutModal.tsx - 更新：预填充 + 每日限制提示（可选，在提交前检查已在 handleOrderSubmit）
'use client';

import React, { useState, useEffect } from 'react';
import type { CartItem } from './Cart';
import { getUserInfo } from '../utils/orderUtils'; // 假设工具函数在 utils/orderUtils.ts

interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  address: string;
  items: {
    variantId: string;
    quantity: number;
  }[];
}

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onSubmit: (input: CreateOrderInput) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ cart, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 加载本地存储的用户信息
  useEffect(() => {
    const savedInfo = getUserInfo();
    if (savedInfo) {
      setForm(savedInfo);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.address) return;
    setLoading(true);
    try {
      await onSubmit({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        address: form.address,
        items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      });
      onClose();
    } catch (error) {
      alert('订单提交失败');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">结账</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="姓名"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="tel"
            placeholder="电话号码"
            value={form.customerPhone}
            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="收货地址"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            required
          />
          <div className="pt-4 border-t">
            <p className="text-xl font-bold text-green-600">总计: ￥{total.toFixed(2)}</p>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '处理中...' : '提交订单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};