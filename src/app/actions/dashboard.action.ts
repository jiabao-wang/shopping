"use server"

import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

// 拆分后的独立函数：获取统计计数
export async function getDashboardCounts() {
  const [productCount, categoryCount, orderCount, pendingOrderCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: { not: OrderStatus.COMPLETED }
        }
      }),
    ])
  return {
    productCount,
    categoryCount,
    orderCount,
    pendingOrderCount,
  }
}

// 拆分后的独立函数：获取最新订单
export async function getLatestOrders() {
  const latestOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      address: true,
    }
  })
  return latestOrders.map(o => ({
    ...o,
    totalAmount: o.totalAmount.toString()
  }))
}

// 拆分后的独立函数：获取最近销售数据（用于销售图表） - 添加30天过滤
export async function getRecentSales() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSales = await prisma.order.findMany({
    where: { 
      status: OrderStatus.COMPLETED,
      createdAt: { gte: thirtyDaysAgo }
    },
    orderBy: { createdAt: "asc" },
    select: {
      totalAmount: true,
      createdAt: true
    }
  });
  return recentSales.map(o => ({
    amount: parseFloat(o.totalAmount.toString()),
    date: o.createdAt
  }));
}

// 拆分后的独立函数：获取Top产品
export async function getTopProducts() {
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: "desc" }
    },
    take: 5
  });

  const productsWithName = await Promise.all(
    topProducts.map(async item => {
      const p = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true }
      });
      return {
        name: p?.name || "未知商品",
        quantity: item._sum.quantity || 0
      };
    })
  );

  return productsWithName;
}

// 新函数：获取订单统计数据（按时间粒度分组） - 使用JS分组避免Prisma限制（扩展：添加延期和已完成）
export async function getOrderStats(period: 'day' | 'month' | 'year') {
  const now = new Date();
  let startDate: Date;
  let numPeriods = 7;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - numPeriods * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - numPeriods * 30 * 24 * 60 * 60 * 1000); // 约7个月
      break;
    case 'year':
      startDate = new Date(now.getTime() - numPeriods * 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error('Invalid period');
  }

  // 查询指定时间范围内所有状态订单
  const [initializedOrders, shippedOrders, delayedOrders, completedOrders] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: OrderStatus.INITIALIZED,
        createdAt: { gte: startDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.order.findMany({
      where: {
        status: OrderStatus.SHIPPED,
        createdAt: { gte: startDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.order.findMany({
      where: {
        status: OrderStatus.DELAYED,
        createdAt: { gte: startDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: startDate }
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  // 生成 labels
  let labels: string[] = [];
  if (period === 'day') {
    for (let i = 0; i < numPeriods; i++) {
      const date = new Date(now.getTime() - (numPeriods - 1 - i) * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    }
  } else if (period === 'month') {
    for (let i = 0; i < numPeriods; i++) {
      const monthDate = new Date(now.getTime() - (numPeriods - 1 - i) * 30 * 24 * 60 * 60 * 1000);
      labels.push(`${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`);
    }
  } else if (period === 'year') {
    for (let i = 0; i < numPeriods; i++) {
      const year = now.getFullYear() - (numPeriods - 1 - i);
      labels.push(`${year}年`);
    }
  }

  // JS中分组计数
  const initCounts = new Map<string, number>();
  const shipCounts = new Map<string, number>();
  const delayCounts = new Map<string, number>();
  const completeCounts = new Map<string, number>();

  const getLabelKey = (date: Date, p: 'day' | 'month' | 'year') => {
    if (p === 'day') {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } else if (p === 'month') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    } else {
      return `${date.getFullYear()}年`;
    }
  };

  initializedOrders.forEach(order => {
    const key = getLabelKey(order.createdAt, period);
    initCounts.set(key, (initCounts.get(key) || 0) + 1);
  });

  shippedOrders.forEach(order => {
    const key = getLabelKey(order.createdAt, period);
    shipCounts.set(key, (shipCounts.get(key) || 0) + 1);
  });

  delayedOrders.forEach(order => {
    const key = getLabelKey(order.createdAt, period);
    delayCounts.set(key, (delayCounts.get(key) || 0) + 1);
  });

  completedOrders.forEach(order => {
    const key = getLabelKey(order.createdAt, period);
    completeCounts.set(key, (completeCounts.get(key) || 0) + 1);
  });

  // 构建数据数组
  const initializedData: number[] = [];
  const shippedData: number[] = [];
  const delayedData: number[] = [];
  const completedData: number[] = [];

  labels.forEach(label => {
    initializedData.push(initCounts.get(label) || 0);
    shippedData.push(shipCounts.get(label) || 0);
    delayedData.push(delayCounts.get(label) || 0);
    completedData.push(completeCounts.get(label) || 0);
  });

  return {
    labels,
    datasets: [
      {
        label: '新订单',
        data: initializedData,
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1,
      },
      {
        label: '已发货',
        data: shippedData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: '延期',
        data: delayedData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // 红色
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: '已完成',
        data: completedData,
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // 绿色
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ]
  };
}

// 更新后的主 dashboard 数据函数（调用拆分函数，避免超时）
export async function getDashboardData() {
  const [counts, latestOrders, recentSales, topProducts] = await Promise.all([
    getDashboardCounts(),
    getLatestOrders(),
    getRecentSales(),
    getTopProducts(),
  ]);

  return {
    ...counts,
    latestOrders: latestOrders || [], // 确保数组
    recentSales: recentSales || [], // 确保数组
    topProducts: topProducts || [], // 确保数组
  };
}