"use server"

import { prisma } from "@/lib/prisma"

// 创建类别
export async function createCategory({
  name,
  desp,
  image,
}: {
  name: string;
  desp?: string;
  image?: string;
}) {
  try {
    const resp = await prisma.category.create({
      data: {
        name,
        description: desp,
        ...(image && { image }),
      },
    });
    return { success: true, data: resp };
  } catch (error) {
    console.error("创建类别失败:", error);
    return { success: false, error: "创建类别失败" };
  }
}


// 删除类别
export async function deleteCategory(id: string) {
    try {
        // 检查是否有关联的商品
        const categoryWithProducts = await prisma.category.findUnique({
            where: { id },
            include: { products: true }
        })

        if (categoryWithProducts?.products.length) {
            return { 
                success: false, 
                error: "该类别下存在商品，无法删除。请先删除或移动该类别下的商品。" 
            }
        }

        const resp = await prisma.category.delete({
            where: { id }
        })
        return { success: true, data: resp }
    } catch (error) {
        console.error("删除类别失败:", error);
        return { success: false, error: "删除类别失败" }
    }
}

export async function updateCategory({
  id,
  name,
  description,
  image,
}: {
  id: string;
  name?: string;
  description?: string;
  image?: string;
}) {
  try {
    const resp = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(image !== undefined && { image }),
      },
    });
    return { success: true, data: resp };
  } catch (error) {
    console.error("更新类别失败:", error);
    return { success: false, error: "更新类别失败" };
  }
}


// 获取类别列表（支持模糊搜索）
export async function getCategories({ 
    search, 
    page = 1, 
    pageSize = 10 
}: { 
    search?: string, 
    page?: number, 
    pageSize?: number 
}) {
    try {
        const skip = (page - 1) * pageSize
        const where = search ? {
            OR: [
                { name: { contains: search } },
                { description: { contains: search } }
            ]
        } : {}

        const [total, categories] = await Promise.all([
            // 获取总数
            prisma.category.count({ where }),
            // 获取分页数据
            prisma.category.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            })
        ])

        return { 
            success: true, 
            data: {
                total,
                totalPages: Math.ceil(total / pageSize),
                currentPage: page,
                pageSize,
                categories
            }
        }
    } catch (error) {
        console.error("获取类别列表失败:", error);
        return { success: false, error: "获取类别列表失败" }
    }
}

// 获取单个类别详情
export async function getCategory(id: string) {
    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                products: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        mainImage: true,
                        price: true,
                        isActive: true
                    }
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!category) {
            return { success: false, error: "类别不存在" }
        }

        return { success: true, data: category }
    } catch (error) {
        console.error("获取类别详情失败:", error);
        return { success: false, error: "获取类别详情失败" }
    }
}