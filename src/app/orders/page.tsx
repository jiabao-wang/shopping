// app/orders/page.tsx (更新：用订单 ID 获取实时状态)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrderHistory, clearLocalCache } from '@/utils/orderUtils';
import { getOrder } from '@/app/actions/order.action'; // 新增：导入 getOrder 接口
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import { OrderStatus } from '@prisma/client';

// 状态 Badge 组件
const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const getStatusInfo = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.INITIALIZED: return { label: '已下单', className: 'bg-yellow-100 text-yellow-700' };
      case OrderStatus.SHIPPED: return { label: '已发货', className: 'bg-blue-100 text-blue-700' };
      case OrderStatus.DELAYED: return { label: '延期发货', className: 'bg-red-100 text-red-700' };
      case OrderStatus.COMPLETED: return { label: '订单结束', className: 'bg-green-100 text-green-700' };
      default: return { label: s, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const { label, className } = getStatusInfo(status);

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // 新增：更新状态

  useEffect(() => {
    loadAndUpdateOrders();
  }, []);

  const loadAndUpdateOrders = async () => {
    setLoading(true);
    try {
      const history = getOrderHistory();
      if (history.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // 并行获取每个订单的实时数据
      const updatedOrders = await Promise.all(
        history.map(async (localOrder: any) => {
          try {
            const res = await getOrder(localOrder.id); // 用 ID 获取实时订单
            if (res.success) {
              return { ...localOrder, ...res.data }; // 合并，覆盖状态等实时数据
            }
            // 如果失败，fallback 到本地数据
            console.warn(`Failed to fetch order ${localOrder.id}, using local data`);
            return localOrder;
          } catch (error) {
            console.error(`Error fetching order ${localOrder.id}:`, error);
            return localOrder;
          }
        })
      );

      setOrders(updatedOrders);
    } catch (error) {
      console.error('Failed to load order history:', error);
      toast.error('加载订单历史失败');
      setOrders(getOrderHistory()); // fallback 到本地
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('确定要清除所有本地订单记录吗？这将删除所有缓存的订单信息。')) {
      clearLocalCache();
      setOrders([]);
      toast.success('缓存已清除');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">订单历史</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleClearCache}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              清除缓存
            </button>
            <button
              onClick={loadAndUpdateOrders}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {updating ? '更新中...' : '刷新状态'}
            </button>
          </div>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">暂无订单历史</p>
            <Link href="/" className="text-blue-500 hover:underline mt-4 block">
              返回首页继续购物
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">订单 #{order.orderNumber || `ORD-${index + 1}`}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-2">
                  {order.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-center space-x-4 text-sm">
                      <img
                        src={item.product?.mainImage || '/placeholder.jpg'}
                        alt={item.product?.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-gray-600">规格: {item.variant?.size} / {item.variant?.color}</p>
                        <p className="text-gray-600">数量: {item.quantity} x ￥{item.price}</p>
                        <p className="font-semibold">小计: ￥{(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mt-4 text-right">
                  <p className="text-lg font-bold">总计: ￥{Number(order.totalAmount).toFixed(2)}</p>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>收货人: {order.customerName}</p>
                  <p>电话: {order.customerPhone}</p>
                  <p>地址: {order.address}</p>
                  <p>状态: <StatusBadge status={order.status} /></p> {/* 使用 Badge 组件 */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;