"use server";

import { prisma } from "@/lib/prisma";

// 获取配置（如果不存在则创建默认配置）
export async function getConfig() {
  try {
    let config = await prisma.config.findFirst();

    if (!config) {
      config = await prisma.config.create({
        data: {
          storeName: "E-Shop 商城",
          storeLogo: "/logo.png",
          storeDescription: "您的购物天堂，提供优质商品和服务。",
          carouselImages: [],
          announcement: "",
          address: "北京市朝阳区某街道123号",
          postalCode: "100000",
          phone: "400-123-4567",
          email: "service@eshop.com",
          workHours: "周一至周日 9:00-18:00",
        },
      });
    }

    return { success: true, data: config };
  } catch (error) {
    console.error("获取配置失败:", error);
    return { success: false, error: "获取配置失败" };
  }
}

// 更新配置
export async function updateConfig(data: any) {
  try {
    const existing = await prisma.config.findFirst();

    if (!existing) {
      return { success: false, error: "配置不存在，请先创建配置。" };
    }

    const updated = await prisma.config.update({
      where: { id: existing.id },
      data: {
        storeName: data.storeName,
        storeLogo: data.storeLogo,
        storeDescription: data.storeDescription,
        carouselImages: data.carouselImages || [],
        announcement: data.announcement,
        address: data.address,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        workHours: data.workHours,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("更新配置失败:", error);
    return { success: false, error: "更新配置失败" };
  }
}