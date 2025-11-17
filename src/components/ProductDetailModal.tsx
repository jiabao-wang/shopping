// components/ProductDetailModal.tsx
'use client';

import React, { useState } from 'react';
import { Variant } from "@prisma/client";

interface ProductDetailModalProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    mainImage: string;
    images: string[];
    variants: {
      id: string;
      size: string;
      color: string;
      stock: number;
    }[];
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    categoryId: string;
  } | null;
  onClose: () => void;
  onAddToCart: (variantId: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  // 获取选中变体的最大库存
  const maxStock = selectedVariant
    ? product.variants.find((v) => v.id === selectedVariant)?.stock || 1
    : 1;

  // 处理数量变化：支持自由输入，解析为整数，clamp 到 [1, maxStock]
  const handleQuantityChange = (value: string) => {
    if (!value) {
      setQuantity(1); // 如果清空，默认为1
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(1); // 无效输入默认为1
      return;
    }
    setQuantity(Math.min(Math.max(1, num), maxStock)); // clamp 到 [1, maxStock]
  };

  // 递减数量
  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  // 递增数量
  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <img
              src={product.mainImage}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
            {product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-24 h-24 rounded cursor-pointer hover:opacity-80 object-cover"
                    onClick={() => {/* 可以切换主图 */ }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
            <div className="text-3xl font-bold text-green-600">￥{product.price.toFixed(2)}</div>
            <div>
              <h4 className="font-semibold mb-3">可选择库存款式:</h4>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择款式</option>
                {product.variants
                  .filter((v) => v.stock > 0)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} / {v.color} (剩余:{v.stock}件)
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="font-medium">购买件数:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-16 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= maxStock}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">最大: {maxStock} 件</span>
            </div>
            <button
              onClick={() => selectedVariant && onAddToCart(selectedVariant, quantity)}
              disabled={!selectedVariant}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              加入购物车
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};