'use server';

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// 创建订单接口
interface CreateOrderInput {
    customerName: string;
    customerPhone: string;
    address: string;
    items: {
        variantId: string;
        quantity: number;
    }[];
}

// 创建订单号
function generateOrderNumber() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${timestamp}${random}`;
}

// 下单（只校验库存，不扣库存）
export async function createOrder(input: CreateOrderInput) {
    try {
        // 1. 获取变体信息（事务外）
        const variantIds = input.items.map(item => item.variantId);
        const variants = await prisma.variant.findMany({
            where: { id: { in: variantIds } },
            include: {
                product: {
                    select: { price: true, isActive: true }
                }
            }
        });

        const variantMap = new Map(variants.map(v => [v.id, v]));

        // 2. 验证商品有效性
        for (const item of input.items) {
            const v = variantMap.get(item.variantId);
            if (!v) {
                return { success: false, error: `变体不存在: ${item.variantId}` };
            }
            if (!v.product.isActive) {
                return { success: false, error: `商品已下架` };
            }
            if (v.stock < item.quantity) {
                return { success: false, error: `${v.size}/${v.color} 库存不足` };
            }
        }

        // 3. 计算总价
        const totalAmount = input.items.reduce((sum, item) => {
            const v = variantMap.get(item.variantId)!;
            return sum + Number(v.product.price) * item.quantity;
        }, 0);

        // 4. 创建订单（无库存扣减）
        const order = await prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                status: OrderStatus.INITIALIZED,
                totalAmount,
                customerName: input.customerName,
                customerPhone: input.customerPhone,
                address: input.address,
                items: {
                    create: input.items.map(item => ({
                        quantity: item.quantity,
                        price: Number(variantMap.get(item.variantId)!.product.price),
                        productId: variants.find(v => v.id === item.variantId)!.productId,
                        variantId: item.variantId
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, mainImage: true } },
                        variant: { select: { size: true, color: true } }
                    }
                }
            }
        });

        return { success: true, data: order };

    } catch (err) {
        console.error("创建订单失败:", err);
        return { success: false, error: "创建订单失败，请稍后再试" };
    }
}


// 获取订单列表（保持不变）
export async function getOrders({
    search,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    pageSize = 10,
}: {
    search?: string;
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    pageSize?: number;
}) {
    try {
        const skip = (page - 1) * pageSize;

        // 构建查询条件
        const where = {
            AND: [
                // 搜索条件（订单号、客户信息）
                search ? {
                    OR: [
                        { orderNumber: { contains: search } },
                        { customerName: { contains: search } },
                        { customerPhone: { contains: search } },
                        { address: { contains: search } }
                    ]
                } : {},
                // 订单状态
                status ? { status } : {},
                // 日期范围
                startDate ? { createdAt: { gte: startDate } } : {},
                endDate ? { createdAt: { lte: endDate } } : {},
                // 金额范围
                minAmount ? { totalAmount: { gte: minAmount } } : {},
                maxAmount ? { totalAmount: { lte: maxAmount } } : {}
            ]
        };

        // 并行获取总数和分页数据
        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    mainImage: true
                                }
                            },
                            variant: {
                                select: {
                                    size: true,
                                    color: true
                                }
                            }
                        }
                    }
                }
            })
        ]);

        return {
            success: true,
            data: {
                total,
                totalPages: Math.ceil(total / pageSize),
                currentPage: page,
                pageSize,
                orders
            }
        };
    } catch (error) {
        console.error("获取订单列表失败:", error);
        return { success: false, error: "获取订单列表失败" };
    }
}

// 获取订单详情（保持不变）
export async function getOrder(id: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                mainImage: true,
                                description: true
                            }
                        },
                        variant: {
                            select: {
                                id: true,
                                size: true,
                                color: true,
                                stock: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return { success: false, error: "订单不存在" };
        }

        return { success: true, data: order };
    } catch (error) {
        console.error("获取订单详情失败:", error);
        return { success: false, error: "获取订单详情失败" };
    }
}

// 更新订单状态（SHIPPED 阶段扣库存）
export async function updateOrderStatus({ id, status }: {
    id: string;
    status: OrderStatus;
}) {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!order) {
            return { success: false, error: "订单不存在" };
        }

        // 状态合法性检查
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            INITIALIZED: [OrderStatus.SHIPPED, OrderStatus.DELAYED],
            SHIPPED: [OrderStatus.COMPLETED],
            DELAYED: [OrderStatus.SHIPPED, OrderStatus.COMPLETED],
            COMPLETED: []
        };

        if (!validTransitions[order.status].includes(status)) {
            return {
                success: false,
                error: `不能从 ${order.status} 变更为 ${status}`
            };
        }

        // ==========================
        // 🚚 SHIPPED 阶段扣库存逻辑
        // ==========================
        if (order.status === OrderStatus.INITIALIZED && status === OrderStatus.SHIPPED) {
            await prisma.$transaction(async (tx) => {

                // 1. 再次获取最新库存数据
                const variantIds = order.items.map(i => i.variantId);
                const variants = await tx.variant.findMany({
                    where: { id: { in: variantIds } },
                    select: { id: true, stock: true }
                });

                const variantMap = new Map(variants.map(v => [v.id, v.stock]));

                // 2. 库存检查
                for (const item of order.items) {
                    const stock = variantMap.get(item.variantId) || 0;
                    if (stock < item.quantity) {
                        throw new Error(`库存不足：${item.variantId}`);
                    }
                }

                // 3. 扣库存
                for (const item of order.items) {
                    await tx.variant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: {
                                decrement: item.quantity
                            }
                        }
                    });
                }

                // 4. 更新订单状态
                await tx.order.update({
                    where: { id },
                    data: { status }
                });
            });

            return { success: true, message: "订单已发货，库存已扣减" };
        }

        // 其他状态直接更新
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        return { success: true, data: updatedOrder };

    } catch (err: any) {
        console.error("更新订单状态失败:", err);
        return { success: false, error: err.message || "更新失败" };
    }
}


// 获取订单统计信息（保持不变）
export async function getOrderStats({
    startDate,
    endDate
}: {
    startDate?: Date;
    endDate?: Date;
}) {
    try {
        const where = {
            AND: [
                startDate ? { createdAt: { gte: startDate } } : {},
                endDate ? { createdAt: { lte: endDate } } : {}
            ]
        };

        const [
            totalOrders,
            statusCounts,
            totalAmount
        ] = await Promise.all([
            // 总订单数
            prisma.order.count({ where }),
            // 各状态订单数
            prisma.order.groupBy({
                by: ['status'],
                where,
                _count: true
            }),
            // 总金额
            prisma.order.aggregate({
                where,
                _sum: {
                    totalAmount: true
                }
            })
        ]);

        const statusStats = Object.fromEntries(
            statusCounts.map(({ status, _count }) => [status, _count])
        );

        return {
            success: true,
            data: {
                totalOrders,
                totalAmount: totalAmount._sum.totalAmount || 0,
                statusStats
            }
        };
    } catch (error) {
        console.error("获取订单统计失败:", error);
        return { success: false, error: "获取订单统计失败" };
    }
}