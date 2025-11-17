"use client";

import { useEffect, useState } from "react";
import { getOrder, updateOrderStatus } from "@/app/actions/order.action";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import OrderTimeline from "@/components/OrderTimeline";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
    const id = params.id;
    const router = useRouter();

    const [order, setOrder] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        const res = await getOrder(id);
        if (res.success) {
            setOrder(res.data);
        } else {
            alert(res.error || "获取订单失败");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetch();
    }, [id]);

    if (!order) {
        return <div className="p-4 sm:p-6 min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>;
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        INITIALIZED: [OrderStatus.SHIPPED, OrderStatus.DELAYED],
        SHIPPED: [OrderStatus.COMPLETED],
        DELAYED: [OrderStatus.SHIPPED, OrderStatus.COMPLETED],
        COMPLETED: []
    };

    const changeStatus = async (target: OrderStatus) => {
        if (!confirm(`确定将订单 ${order.orderNumber} 状态改为 ${target} 吗？`)) return;
        setLoading(true);
        const res = await updateOrderStatus({ id: order.id, status: target });
        if (res.success) {
            alert("状态更新成功");
            await fetch();
        } else {
            alert(res.error || "更新失败");
        }
        setLoading(false);
    };

    const currency = (v: any) => `¥${Number(v).toFixed(2)}`;

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow">
                    <div className="w-full sm:w-auto">
                        <h1 className="text-xl sm:text-2xl font-bold">{order.orderNumber}</h1>
                        <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="text-right w-full sm:w-auto">
                        <div className="font-semibold text-lg sm:text-xl">{currency(order.totalAmount)}</div>
                        <div className="mt-1">
                            <span className="px-2 py-1 rounded text-sm bg-gray-100">
                                {order.status === "INITIALIZED" ? "新订单" :
                                    order.status === "SHIPPED" ? "已发货" :
                                        order.status === "DELAYED" ? "延期" :
                                            order.status === "COMPLETED" ? "已完成" : order.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 客户信息 - 移动端全宽堆叠 */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium mb-2">客户信息</h3>
                        <div className="text-lg">{order.customerName}</div>
                        <div className="text-sm text-gray-500 mt-1">{order.customerPhone}</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium mb-2">收货地址</h3>
                        <div className="text-sm leading-relaxed">{order.address}</div>
                    </div>
                </div>

                {/* 商品清单 - 移动端垂直布局，图像全宽 */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <h3 className="font-medium mb-3">商品明细</h3>
                    <ul className="divide-y divide-gray-200 space-y-3">
                        {order.items.map((it: any) => (
                            <li key={it.id} className="pt-3 first:pt-0">
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                    <img 
                                        src={it.product.mainImage} 
                                        alt={it.product.name} 
                                        className="w-full sm:w-24 h-24 sm:h-auto object-cover rounded flex-shrink-0" 
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="font-medium text-sm sm:text-base">{it.product.name}</div>
                                        <div className="text-xs text-gray-500">规格：{it.variant.size} / {it.variant.color}</div>
                                        <div className="text-xs text-gray-700">数量：{it.quantity} × 单价：¥{Number(it.price)}</div>
                                    </div>
                                    <div className="font-semibold text-sm sm:text-base text-right sm:text-left">小计：¥{(Number(it.price) * it.quantity).toFixed(2)}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 订单进度 */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <h3 className="font-medium mb-3">订单进度</h3>
                    <OrderTimeline
                        status={order.status}
                        createdAt={order.createdAt}
                        shippedAt={order.shippedAt}
                        completedAt={order.completedAt}
                        delayedAt={order.delayedAt}
                    />
                </div>

                {/* 订单操作 - 移动端全宽按钮堆叠 */}
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow">
                    {validTransitions[order.status as OrderStatus].map((t) => (
                        <button
                            key={t}
                            className="px-4 py-2 bg-blue-600 text-white rounded flex-1 text-sm sm:text-base"
                            onClick={() => changeStatus(t)}
                            disabled={loading}
                        >
                            标记为 {t === "SHIPPED" ? "已发货" : t === "COMPLETED" ? "已完成" : "延期"}
                        </button>
                    ))}

                    <button
                        className="px-4 py-2 border rounded flex-1 text-sm sm:text-base"
                        onClick={() => {
                            // 导出当前订单为 JSON 文件
                            const a = document.createElement("a");
                            const blob = new Blob([JSON.stringify(order, null, 2)], { type: "application/json" });
                            a.href = URL.createObjectURL(blob);
                            a.download = `${order.orderNumber}.json`;
                            a.click();
                            URL.revokeObjectURL(a.href);
                        }}
                    >
                        导出 JSON
                    </button>

                    <button 
                        className="px-4 py-2 border rounded flex-1 text-sm sm:text-base" 
                        onClick={() => router.back()}
                    >
                        返回
                    </button>
                </div>
            </div>
        </div>
    );
}