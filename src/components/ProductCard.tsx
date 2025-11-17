// components/ProductCard.tsx
import React from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    mainImage: string;
    images: string[];
    variants: any[]; // 假设 Variant 类型
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    categoryId: string;
  };
  onClick: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => (
  <div
    onClick={() => onClick(product.id)}
    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
  >
    <div className="relative h-48 w-full overflow-hidden">
      <img
        src={product.mainImage}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-green-600">￥{product.price.toFixed(2)}</span>
        <span className="text-sm text-gray-500">
          剩余{product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)} 件
        </span>
      </div>
    </div>
  </div>
);