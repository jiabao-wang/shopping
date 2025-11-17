// app/orders/[id]/page.tsx (新页面：订单详情页，使用 OrderDetail 组件)
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrder } from '@/app/actions/order.action'; // 导入 getOrder 动作
import OrderDetail from '@/components/OrderDetail'; // 导入 Receipt 组件

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null); // 使用 any 或定义 Order 类型
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await getOrder(orderId);
        if (res.success) {
          setOrder(res.data);
        } else {
          alert('订单不存在');
        }
      } catch (error) {
        console.error('获取订单失败:', error);
        alert('加载订单失败');
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-500">订单不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">订单详情</h1>
        <OrderDetail order={order} />
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}