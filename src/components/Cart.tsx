// components/Cart.tsx
'use client';

import React from 'react';
import Link from 'next/link'; // 新增：导入 Link 用于跳转历史订单

export interface CartItem {
  variantId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartProps {
  cart: CartItem[];
  onUpdate: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}

export const Cart: React.FC<CartProps> = ({ cart, onUpdate, onRemove, onCheckout, onClose }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-40 p-4">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">购物车</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">您的购物车为空</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.variantId} className="flex space-x-4 p-3 border rounded-lg">
                  <img
                    src={item.image || '/placeholder.jpg'}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"  // 缩小图片到 w-12 h-12
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate text-sm">{item.name}</h4>  {/* 商品名称 */}
                    <p className="text-xs text-gray-600 truncate">尺寸: {item.size} / 颜色: {item.color}</p>  {/* 尺寸/颜色 */}
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        onClick={() => onUpdate(item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 border rounded flex items-center justify-center text-sm disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>  {/* 购买数量 */}
                      <button
                        onClick={() => onUpdate(item.variantId, item.quantity + 1)}
                        className="w-6 h-6 border rounded flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm">￥{(item.price * item.quantity).toFixed(2)}</p>  {/* 小计价格 */}
                    <p className="text-xs text-gray-500">单价: ￥{item.price.toFixed(2)}</p>  {/* 单价 */}
                    <button
                      onClick={() => onRemove(item.variantId)}
                      className="text-red-500 text-xs hover:underline mt-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t space-y-3">
                <p className="text-xl font-bold">总计: ￥{total.toFixed(2)}</p>
                <button
                  onClick={onCheckout}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold"
                  disabled={cart.length === 0}
                >
                  前往结账
                </button>
              </div>
            </>
          )}
          {/* 始终显示历史订单链接 */}
          <div className="pt-4 border-t text-center">
            <Link href="/orders" className="block text-blue-500 text-sm hover:underline">
              查看历史订单
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};