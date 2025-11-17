// components/Footer.tsx
import React from 'react';

interface FooterProps {
  config?: any; // 配置数据
}

export const Footer: React.FC<FooterProps> = ({ config }) => {
  // const defaultConfig = {
  //   storeName: 'E-Shop 商城',
  //   storeLogo: '/logo.png',
  //   storeDescription: '您的购物天堂，提供优质商品和服务。',
  //   address: '北京市朝阳区某街道123号',
  //   postalCode: '100000',
  //   phone: '400-123-4567',
  //   email: 'service@eshop.com',
  //   workHours: '周一至周日 9:00-18:00'
  // };

  const finalConfig = { ...config };

  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo 和店铺信息 */}
        <div className="flex flex-col items-center md:items-start">
          <img 
            src={finalConfig.storeLogo} 
            alt="店铺 Logo" 
            className="w-16 h-16 mb-4 rounded-full" 
          />
          <h3 className="text-lg font-bold mb-2">{finalConfig.storeName}</h3>
          <p className="text-sm text-gray-300">{finalConfig.storeDescription}</p>
        </div>
        {/* 联系方式 */}
        <div>
          <h4 className="text-lg font-semibold mb-4">联系我们</h4>
          <ul className="space-y-2 text-sm">
            <li>电话: {finalConfig.phone}</li>
            <li>邮箱: {finalConfig.email}</li>
            <li>工作时间: {finalConfig.workHours}</li>
          </ul>
        </div>
        {/* 地址 */}
        <div>
          <h4 className="text-lg font-semibold mb-4">店铺地址</h4>
          <p className="text-sm text-gray-300">
            {finalConfig.address}<br />
            邮编: {finalConfig.postalCode}
          </p>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-xs text-gray-400">
        © 2025 {finalConfig.storeName}. 版权所有.
      </div>
    </footer>
  );
};