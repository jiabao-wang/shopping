"use client";

import { useEffect, useState } from "react";
import { getDashboardData, getOrderStats } from "@/app/actions/dashboard.action";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import OrderStatsChart from "@/components/OrderStatsChart";
import SalesChart from "@/components/SalesChart";
import TopProductsChart from "@/components/TopProductsChart";
import CompletionChart from "@/components/CompletionChart";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getOrderStats(period)
      .then(setOrderStats)
      .catch(console.error); // 防止错误导致崩溃
  }, [period]);

  if (loading || !data) {
    return <Loader/>;
  }

  const getStatusBadge = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.INITIALIZED: return "bg-yellow-100 text-yellow-700";
      case OrderStatus.SHIPPED: return "bg-blue-100 text-blue-700";
      case OrderStatus.DELAYED: return "bg-red-100 text-red-700";
      case OrderStatus.COMPLETED: return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.INITIALIZED: return "新订单";
      case OrderStatus.SHIPPED: return "已发货";
      case OrderStatus.DELAYED: return "延期";
      case OrderStatus.COMPLETED: return "已完成";
      default: return s;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 min-h-screen bg-gray-50">
      <h2 className="text-xl sm:text-2xl font-bold">后台统计</h2>

      {/* 统计卡片 - 移动端单列，桌面多列 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="商品总数" value={data.productCount || 0} />
        <StatCard label="分类总数" value={data.categoryCount || 0} />
        <StatCard label="订单总数" value={data.orderCount || 0} />
        <StatCard
          label="待处理订单"
          value={data.pendingOrderCount || 0}
          highlight
        />
      </div>

      {/* 订单统计图表 */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h3 className="font-semibold text-lg">订单统计</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'day' | 'month' | 'year')}
            className="border px-3 py-1 rounded text-sm"
          >
            <option value="day">最近7天</option>
            <option value="month">最近7月</option>
            <option value="year">最近7年</option>
          </select>
        </div>
        <OrderStatsChart data={orderStats} period={period} />
      </div>

      {/* 最新订单 - 移动端卡片布局 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">最新订单</h3>
        </div>
        <div className="divide-y">
          {(data.latestOrders || []).map((o: any) => (
            <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="block hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{o.orderNumber}</p>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(o.status)}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">客户：{o.customerName}</p>
                    <p className="text-sm text-gray-600">电话：{o.customerPhone}</p>
                    <p className="text-sm text-gray-600">地址：{o.address}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="font-semibold text-base">¥{o.totalAmount}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {(!data.latestOrders || data.latestOrders.length === 0) && (
            <div className="p-4 text-center text-gray-500">暂无订单</div>
          )}
        </div>
      </div>

      {/* 图表布局 - 移动端单列，桌面双列 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={data.recentSales || []} />
        <TopProductsChart data={data.topProducts || []} />
        {/* <CompletionChart
          completed={(data.orderCount || 0) - (data.pendingOrderCount || 0)}
          total={data.orderCount || 0}
        /> */}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`p-4 rounded-lg shadow text-center transition-colors ${
        highlight ? "bg-red-50 border border-red-200" : "bg-white"
      }`}
    >
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
    </div>
  );
}