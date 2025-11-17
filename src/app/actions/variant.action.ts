'use server';

import { prisma } from "@/lib/prisma";

// 创建变体接口
interface CreateVariantInput {
    productId: string;
    size: string;
    color: string;
    stock: number;
}

// 更新变体接口
interface UpdateVariantInput {
    id: string;
    size?: string;
    color?: string;
    stock?: number;
}

// 创建商品变体
export async function createVariant(input: CreateVariantInput) {
    try {
        // 验证商品是否存在
        const product = await prisma.product.findUnique({
            where: { id: input.productId }
        });

        if (!product) {
            return { success: false, error: "商品不存在" };
        }

        // 验证是否已存在相同尺寸和颜色的变体
        const existingVariant = await prisma.variant.findFirst({
            where: {
                productId: input.productId,
                size: input.size,
                color: input.color
            }
        });

        if (existingVariant) {
            return { 
                success: false, 
                error: `该商品已存在 ${input.size}/${input.color} 的组合` 
            };
        }

        // 创建新变体
        const variant = await prisma.variant.create({
            data: {
                productId: input.productId,
                size: input.size,
                color: input.color,
                stock: input.stock >= 0 ? input.stock : 0 // 确保库存不为负数
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return { success: true, data: variant };
    } catch (error) {
        console.error("创建商品变体失败:", error);
        return { success: false, error: "创建商品变体失败" };
    }
}

// 获取变体列表
export async function getVariants({
    productId,
    search,
    page = 1,
    pageSize = 10,
    minStock,
    maxStock
}: {
    productId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    minStock?: number;
    maxStock?: number;
}) {
    try {
        const skip = (page - 1) * pageSize;

        // 构建查询条件
        const where = {
            AND: [
                // 商品ID筛选
                productId ? { productId } : {},
                // 尺寸或颜色搜索
                search ? {
                    OR: [
                        { size: { contains: search } },
                        { color: { contains: search } }
                    ]
                } : {},
                // 库存范围筛选
                minStock !== undefined ? { stock: { gte: minStock } } : {},
                maxStock !== undefined ? { stock: { lte: maxStock } } : {}
            ]
        };

        // 并行获取总数和分页数据
        const [total, variants] = await Promise.all([
            prisma.variant.count({ where }),
            prisma.variant.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: [
                    { size: 'asc' },
                    { color: 'asc' }
                ],
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            mainImage: true
                        }
                    },
                    _count: {
                        select: { orderItems: true }
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
                variants
            }
        };
    } catch (error) {
        console.error("获取变体列表失败:", error);
        return { success: false, error: "获取变体列表失败" };
    }
}

// 获取单个变体详情
export async function getVariant(id: string) {
    try {
        const variant = await prisma.variant.findUnique({
            where: { id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        mainImage: true,
                        price: true
                    }
                },
                orderItems: {
                    take: 5,  // 只获取最近5条订单
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        quantity: true,
                        createdAt: true,
                        order: {
                            select: {
                                orderNumber: true,
                                status: true
                            }
                        }
                    }
                },
                _count: {
                    select: { orderItems: true }
                }
            }
        });

        if (!variant) {
            return { success: false, error: "变体不存在" };
        }

        return { success: true, data: variant };
    } catch (error) {
        console.error("获取变体详情失败:", error);
        return { success: false, error: "获取变体详情失败" };
    }
}

// 更新变体信息
export async function updateVariant(input: UpdateVariantInput) {
    try {
        const variant = await prisma.variant.findUnique({
            where: { id: input.id },
            include: { orderItems: true }
        });

        if (!variant) {
            return { success: false, error: "变体不存在" };
        }

        // 如果有订单记录，只允许更新库存
        if (variant.orderItems.length > 0 && (input.size || input.color)) {
            return { 
                success: false, 
                error: "该变体已有订单记录，只能更新库存数量" 
            };
        }

        // 如果要更新尺寸或颜色，需要检查是否与其他变体冲突
        if (input.size || input.color) {
            const existingVariant = await prisma.variant.findFirst({
                where: {
                    id: { not: input.id },
                    productId: variant.productId,
                    size: input.size || variant.size,
                    color: input.color || variant.color
                }
            });

            if (existingVariant) {
                return { 
                    success: false, 
                    error: `已存在 ${input.size || variant.size}/${input.color || variant.color} 的组合` 
                };
            }
        }

        // 更新变体
        const updatedVariant = await prisma.variant.update({
            where: { id: input.id },
            data: {
                ...(input.size && { size: input.size }),
                ...(input.color && { color: input.color }),
                ...(input.stock !== undefined && { 
                    stock: input.stock >= 0 ? input.stock : 0 
                })
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return { success: true, data: updatedVariant };
    } catch (error) {
        console.error("更新变体失败:", error);
        return { success: false, error: "更新变体失败" };
    }
}

// 删除变体
export async function deleteVariant(id: string) {
    try {
        const variant = await prisma.variant.findUnique({
            where: { id },
            include: { 
                orderItems: true,
                product: {
                    include: {
                        variants: { select: { id: true } }
                    }
                }
            }
        });

        if (!variant) {
            return { success: false, error: "变体不存在" };
        }

        // 检查是否有订单记录
        if (variant.orderItems.length > 0) {
            return { 
                success: false, 
                error: "该变体已有订单记录，无法删除" 
            };
        }

        // 检查是否是商品的最后一个变体
        if (variant.product.variants.length === 1) {
            return { 
                success: false, 
                error: "无法删除商品的最后一个变体，商品至少需要保留一个变体" 
            };
        }

        // 删除变体
        const deletedVariant = await prisma.variant.delete({
            where: { id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return { success: true, data: deletedVariant };
    } catch (error) {
        console.error("删除变体失败:", error);
        return { success: false, error: "删除变体失败" };
    }
}

// 批量更新库存
export async function batchUpdateStock(updates: { id: string, stock: number }[]) {
    try {
        const results = await Promise.all(
            updates.map(async ({ id, stock }) => {
                try {
                    const variant = await prisma.variant.update({
                        where: { id },
                        data: { 
                            stock: stock >= 0 ? stock : 0 
                        }
                    });
                    return { id, success: true, data: variant };
                } catch (error) {
                    return { id, success: false, error: "更新失败" };
                }
            })
        );

        return { 
            success: true, 
            data: results 
        };
    } catch (error) {
        console.error("批量更新库存失败:", error);
        return { success: false, error: "批量更新库存失败" };
    }
}

// 获取库存预警列表（库存低于指定数量的变体）
export async function getLowStockVariants(threshold: number = 10) {
    try {
        const variants = await prisma.variant.findMany({
            where: {
                stock: { lte: threshold }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        mainImage: true
                    }
                }
            },
            orderBy: { stock: 'asc' }
        });

        return { 
            success: true, 
            data: variants 
        };
    } catch (error) {
        console.error("获取低库存变体列表失败:", error);
        return { success: false, error: "获取低库存变体列表失败" };
    }
}
