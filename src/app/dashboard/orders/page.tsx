"use client";

import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "@/app/actions/order.action";
import { OrderStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * OrdersPage
 * - 列表支持多选 + 批量操作（发货 / 完成 / 延期）
 * - 支持导出当前筛选结果为 CSV
 * - 分页、搜索、状态筛选
 * - 移动端优化：表格转为卡片布局，避免横向滚动；全屏适配
 */

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<OrderStatus | "">("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const pageSize = 10;

    const fetch = async (p = page) => {
        setLoading(true);
        const res = await getOrders({
            search: search || undefined,
            status: status || undefined,
            page: p,
            pageSize
        });
        if (res.success) {
            setOrders(res.data.orders || []);
            setTotalPages(res.data.totalPages || 1);
            // reset selection
            setSelected({});
            setSelectAll(false);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetch(1);
    }, []); // initial

    useEffect(() => {
        // fetch when page/search/status changes (debounce omitted for brevity)
        fetch(1);
    }, [search, status]);

    useEffect(() => {
        fetch(page);
    }, [page]);

    const toggleOne = (id: string) => {
        setSelected(prev => {
            const next = { ...prev, [id]: !prev[id] };
            const all = orders.length > 0 && orders.every(o => next[o.id]);
            setSelectAll(all);
            return next;
        });
    };

    const toggleAll = () => {
        if (!selectAll) {
            const newSel: Record<string, boolean> = {};
            orders.forEach(o => (newSel[o.id] = true));
            setSelected(newSel);
            setSelectAll(true);
        } else {
            setSelected({});
            setSelectAll(false);
        }
    };

    const getSelectedIds = () => Object.keys(selected).filter(id => selected[id]);

    // Valid transitions mapping (same as backend)
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        INITIALIZED: [OrderStatus.SHIPPED, OrderStatus.DELAYED],
        SHIPPED: [OrderStatus.COMPLETED],
        DELAYED: [OrderStatus.SHIPPED, OrderStatus.COMPLETED],
        COMPLETED: []
    };

    const batchUpdateStatus = async (target: OrderStatus) => {
        const ids = getSelectedIds();
        if (!ids.length) return alert("请先选择订单");

        if (!confirm(`确定将 ${ids.length} 个订单标记为 ${target} 吗？`)) return;

        setLoading(true);
        for (const id of ids) {
            try {
                // 调用后端 updateOrderStatus
                // note: updateOrderStatus 接口接收 {id, status, note?}
                // 我这里直接调用（按你的后端实现）
                // 如果你后端路径不一样请替换 import
                // eslint-disable-next-line no-await-in-loop
                await updateOrderStatus({ id, status: target });
            } catch (err) {
                console.error("批量操作单个失败", id, err);
            }
        }
        await fetch(page);
        setLoading(false);
        alert("批量操作完成");
    };

    // 导出当前列表为 CSV（基于当前页）
    const exportExcel = () => {
        if (!orders.length) return alert("当前没有可导出的订单");

        const data = orders.map(o => ({
            "订单号": o.orderNumber,
            "客户": o.customerName,
            "电话": o.customerPhone,
            "地址": o.address,
            "金额": Number(o.totalAmount),
            "状态": o.status,
            "创建时间": new Date(o.createdAt).toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "订单");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        saveAs(blob, `订单导出_${Date.now()}.xlsx`);
    };

    const getStatusBadge = (s: OrderStatus) => {
        switch (s) {
            case "INITIALIZED": return "bg-yellow-100 text-yellow-700";
            case "SHIPPED": return "bg-blue-100 text-blue-700";
            case "DELAYED": return "bg-red-100 text-red-700";
            case "COMPLETED": return "bg-green-100 text-green-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="w-full p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h1 className="text-xl sm:text-2xl font-bold">订单管理</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        className="px-3 py-2 border rounded flex-1 sm:flex-none"
                        onClick={() => fetch(1)}
                        disabled={loading}
                    >
                        刷新
                    </button>
                    <button
                        className="px-3 py-2 bg-gray-50 rounded border flex-1 sm:flex-none"
                        onClick={exportExcel}
                        disabled={!orders.length}
                    >
                        导出当前页
                    </button>
                </div>
            </div>

            {/* Filters - 移动端垂直堆叠 */}
            <div className="flex flex-col gap-2 mb-4">
                <input
                    className="border px-3 py-2 rounded w-full"
                    placeholder="搜索订单号 / 客户 / 电话 / 地址"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-2">
                    <select
                        className="border px-3 py-2 rounded flex-1"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
                    >
                        <option value="">全部状态</option>
                        {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded flex-1 sm:flex-none"
                        onClick={() => { setPage(1); fetch(1); }}
                    >
                        查询
                    </button>
                </div>
            </div>

            {/* Batch actions - 移动端换行堆叠 */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mb-3">
                <label className="flex items-center gap-2 flex-shrink-0">
                    <input type="checkbox" checked={selectAll} onChange={toggleAll} />
                    <span className="text-sm text-gray-600">全选当前页</span>
                </label>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        className="px-3 py-1 border rounded text-sm flex-1 sm:flex-none min-w-[80px]"
                        onClick={() => batchUpdateStatus(OrderStatus.SHIPPED)}
                    >
                        批量发货
                    </button>
                    <button
                        className="px-3 py-1 border rounded text-sm flex-1 sm:flex-none min-w-[80px]"
                        onClick={() => batchUpdateStatus(OrderStatus.COMPLETED)}
                    >
                        批量完成
                    </button>
                    <button
                        className="px-3 py-1 border rounded text-sm flex-1 sm:flex-none min-w-[80px]"
                        onClick={() => batchUpdateStatus(OrderStatus.DELAYED)}
                    >
                        批量延迟
                    </button>
                </div>
            </div>

            {/* 移动端卡片列表，桌面端表格 */}
            <div className="w-full">
                {loading ? (
                    <div className="py-8 text-center">加载中...</div>
                ) : orders.length ? (
                    <>
                        {/* 桌面端表格 */}
                        <div className="hidden md:block">
                            <div className="shadow rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b bg-gray-50">
                                            <th className="py-2 pl-3 w-10"> </th>
                                            <th className="py-2">订单号</th>
                                            <th>客户 / 电话</th>
                                            <th>金额</th>
                                            <th>状态</th>
                                            <th>下单时间</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 pl-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected[o.id]}
                                                        onChange={() => toggleOne(o.id)}
                                                    />
                                                </td>
                                                <td className="py-3 font-medium">{o.orderNumber}</td>
                                                <td>
                                                    <div>{o.customerName}</div>
                                                    <div className="text-xs text-gray-500">{o.customerPhone}</div>
                                                </td>
                                                <td className="font-semibold">¥{Number(o.totalAmount)}</td>
                                                <td>
                                                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(o.status)}`}>
                                                        {o.status === "INITIALIZED" ? "新订单" :
                                                            o.status === "SHIPPED" ? "已发货" :
                                                                o.status === "DELAYED" ? "延期" :
                                                                    o.status === "COMPLETED" ? "已完成" : o.status}
                                                    </span>
                                                </td>
                                                <td className="text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <a
                                                        className="text-blue-600 hover:underline text-sm"
                                                        href={`/dashboard/orders/${o.id}`}
                                                    >
                                                        详情
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 移动端卡片 */}
                        <div className="md:hidden space-y-3">
                            {orders.map(o => (
                                <div key={o.id} className="bg-white rounded-lg shadow p-4 border">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={!!selected[o.id]}
                                                onChange={() => toggleOne(o.id)}
                                                className="mt-0.5"
                                            />
                                            <span className="text-sm font-medium">{o.orderNumber}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(o.status)}`}>
                                            {o.status === "INITIALIZED" ? "新订单" :
                                                o.status === "SHIPPED" ? "已发货" :
                                                    o.status === "DELAYED" ? "延期" :
                                                        o.status === "COMPLETED" ? "已完成" : o.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="font-medium">客户：{o.customerName}</div>
                                        <div className="text-gray-500">电话：{o.customerPhone}</div>
                                        <div className="text-gray-500">地址：{o.address}</div>
                                        <div className="font-semibold">金额：¥{Number(o.totalAmount)}</div>
                                        <div className="text-gray-500">下单时间：{new Date(o.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t">
                                        <a
                                            className="text-blue-600 hover:underline text-sm block w-full text-center"
                                            href={`/dashboard/orders/${o.id}`}
                                        >
                                            查看详情
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-8 text-center text-gray-500">暂无订单</div>
                )}
            </div>

            {/* Pagination - 移动端全宽按钮 */}
            <div className="flex items-center justify-center gap-3 mt-4">
                <button
                    className="px-4 py-2 border rounded disabled:opacity-50 flex-1 max-w-xs"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    上一页
                </button>
                <div className="text-sm min-w-[80px] text-center">第 {page} / {totalPages} 页</div>
                <button
                    className="px-4 py-2 border rounded disabled:opacity-50 flex-1 max-w-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                    下一页
                </button>
            </div>
        </div>
    );
}