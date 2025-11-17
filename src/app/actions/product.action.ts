"use server";

import { prisma } from "@/lib/prisma"

// 创建商品接口
interface CreateProductInput {
    name: string
    description?: string
    price: number
    mainImage: string
    images: string[]  // 其他图片URL数组
    categoryId: string
    variants: {
        size: string
        color: string
        stock: number
    }[]
}

// 更新商品接口
interface UpdateProductInput {
    id: string
    name?: string
    description?: string
    price?: number
    mainImage?: string
    images?: string[]
    categoryId?: string
    isActive?: boolean
}

// 创建商品
export async function createProduct(input: CreateProductInput) {
    try {
        // 验证类别是否存在
        const category = await prisma.category.findUnique({
            where: { id: input.categoryId }
        });

        if (!category) {
            return { success: false, error: "指定的类别不存在" };
        }

        // 创建商品及其变体
        const product = await prisma.product.create({
            data: {
                name: input.name,
                description: input.description,
                price: input.price,
                mainImage: input.mainImage,
                images: JSON.stringify(input.images), // 将图片数组转换为JSON字符串
                categoryId: input.categoryId,
                variants: {
                    create: input.variants
                }
            },
            include: {
                variants: true,
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return { success: true, data: product };
    } catch (error) {
        // console.error("创建商品失败:", error);
        return { success: false, error: "创建商品失败" };
    }
}

// 删除商品
export async function deleteProduct(id: string) {
    try {
        // 检查是否有相关订单
        const productWithOrders = await prisma.product.findUnique({
            where: { id },
            include: {
                orderItems: true
            }
        });

        if (productWithOrders?.orderItems.length) {
            // 如果有订单，则只是将商品标记为下架
            const product = await prisma.product.update({
                where: { id },
                data: { isActive: false }
            });
            return {
                success: true,
                data: product,
                message: "商品已存在订单记录，已将商品标记为下架"
            };
        }

        // 如果没有订单，则可以完全删除
        const product = await prisma.product.delete({
            where: { id },
            include: {
                variants: true
            }
        });

        return { success: true, data: product };
    } catch (error) {
        console.error("删除商品失败:", error);
        return { success: false, error: "删除商品失败" };
    }
}

// 更新商品（支持变体）
// 更新商品（支持变体增删改）
export async function updateProduct(input: UpdateProductInput & {
  variants?: {
    id?: string
    size: string
    color: string
    stock: number
  }[]
}) {
  try {
    // 若更新了 categoryId，先检查类别是否存在
    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId }
      });

      if (!category) {
        return { success: false, error: "指定的类别不存在" };
      }
    }

    // ================================
    // 1️⃣ 更新商品基础信息
    // ================================
    await prisma.product.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.price && { price: input.price }),
        ...(input.mainImage && { mainImage: input.mainImage }),
        ...(input.images && { images: JSON.stringify(input.images) }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(typeof input.isActive === "boolean" && { isActive: input.isActive })
      }
    });

    // ================================
    // 2️⃣ 处理变体（增、删、改）
    // ================================
    if (input.variants && Array.isArray(input.variants)) {

      // 获取数据库中现有的变体
      const existingVariants = await prisma.variant.findMany({
        where: { productId: input.id }
      });

      // 前端传回来的变体的 id 集合
      const incomingIds = input.variants
        .filter(v => v.id)
        .map(v => v.id as string);

      // 找出需要删除的变体（数据库有 → 前端没传）
      const variantsToDelete = existingVariants.filter(v => !incomingIds.includes(v.id));

      // ================================
      // 🔥 删除被前端移除的变体
      // ================================
      for (const v of variantsToDelete) {

        // 若变体已有订单，禁止删除（避免数据不一致）
        const hasOrder = await prisma.orderItem.count({
          where: { variantId: v.id }
        });

        if (hasOrder > 0) {
          // 变体有订单 → 不删除，跳过
          continue;
        }

        await prisma.variant.delete({
          where: { id: v.id }
        });
      }

      // ================================
      // 🔥 更新 / 创建变体
      // ================================
      for (const v of input.variants) {
        if (v.id) {
          // 更新已有变体
          await prisma.variant.update({
            where: { id: v.id },
            data: {
              size: v.size,
              color: v.color,
              stock: v.stock
            }
          });
        } else {
          // 新建变体
          await prisma.variant.create({
            data: {
              productId: input.id,
              size: v.size,
              color: v.color,
              stock: v.stock
            }
          });
        }
      }
    }

    // ================================
    // 3️⃣ 返回更新后的完整商品数据
    // ================================
    const updated = await prisma.product.findUnique({
      where: { id: input.id },
      include: {
        variants: true,
        category: true
      }
    });

    return { success: true, data: updated };

  } catch (error) {
    console.error("更新商品失败:", error);
    return { success: false, error: "更新商品失败" };
  }
}



// 获取商品列表（支持模糊搜索和筛选）
export async function getProducts({
    search,
    categoryId,
    page = 1,
    pageSize = 10,
    includeInactive = false
}: {
    search?: string
    categoryId?: string
    page?: number
    pageSize?: number
    includeInactive?: boolean
}) {
    try {
        const skip = (page - 1) * pageSize;

        // 构建查询条件
        const where = {
            AND: [
                // 搜索条件
                search ? {
                    OR: [
                        { name: { contains: search } },
                        { description: { contains: search } }
                    ]
                } : {},
                // 类别筛选
                categoryId ? { categoryId } : {},
                // 是否包含下架商品
                !includeInactive ? { isActive: true } : {}
            ]
        };

        // 并行获取总数和分页数据
        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    variants: {
                        select: {
                            id: true,
                            size: true,
                            color: true,
                            stock: true
                        }
                    },
                    _count: {
                        select: { orderItems: true }
                    }
                }
            })
        ]);

        // 处理返回的数据，将JSON字符串转换回数组
        const formattedProducts = products.map(product => ({
            ...product,
            price: Number(product.price), // ✅ 转成普通数字
            images: JSON.parse(product.images as string)
        }));

        return {
            success: true,
            data: {
                total,
                totalPages: Math.ceil(total / pageSize),
                currentPage: page,
                pageSize,
                products: formattedProducts
            }
        };
    } catch (error) {
        console.error("获取商品列表失败:", error);
        return { success: false, error: "获取商品列表失败" };
    }
}

// 获取单个商品详情
export async function getProduct(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                variants: {
                    select: {
                        id: true,
                        size: true,
                        color: true,
                        stock: true,
                        _count: {
                            select: { orderItems: true }
                        }
                    }
                },
                _count: {
                    select: { orderItems: true }
                }
            }
        });

        if (!product) {
            return { success: false, error: "商品不存在" };
        }

        // 将JSON字符串转换回数组
        const formattedProduct = {
            ...product,
            price: Number(product.price),
            images: JSON.parse(product.images as string)
        };

        return { success: true, data: formattedProduct };
    } catch (error) {
        console.error("获取商品详情失败:", error);
        return { success: false, error: "获取商品详情失败" };
    }
}

// 更新商品变体库存
export async function updateVariantStock({
    variantId,
    stock
}: {
    variantId: string
    stock: number
}) {
    try {
        if (stock < 0) {
            return { success: false, error: "库存不能小于0" };
        }

        const variant = await prisma.variant.update({
            where: { id: variantId },
            data: { stock }
        });

        return { success: true, data: variant };
    } catch (error) {
        console.error("更新库存失败:", error);
        return { success: false, error: "更新库存失败" };
    }
}

// 添加商品变体
export async function addProductVariant({
    productId,
    size,
    color,
    stock
}: {
    productId: string
    size: string
    color: string
    stock: number
}) {
    try {
        const variant = await prisma.variant.create({
            data: {
                productId,
                size,
                color,
                stock
            }
        });

        return { success: true, data: variant };
    } catch (error) {
        console.error("添加商品变体失败:", error);
        return { success: false, error: "添加商品变体失败" };
    }
}

// 删除商品变体
export async function deleteVariant(id: string) {
    try {
        // 检查是否有相关订单
        const variantWithOrders = await prisma.variant.findUnique({
            where: { id },
            include: {
                orderItems: true
            }
        });

        if (variantWithOrders?.orderItems.length) {
            return {
                success: false,
                error: "该变体已存在订单记录，无法删除"
            };
        }

        const variant = await prisma.variant.delete({
            where: { id }
        });

        return { success: true, data: variant };
    } catch (error) {
        console.error("删除商品变体失败:", error);
        return { success: false, error: "删除商品变体失败" };
    }
}
