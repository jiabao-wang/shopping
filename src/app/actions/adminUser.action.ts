"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 获取所有后台用户
export async function getAdminUsers() {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    return { success: true, data: users };
  } catch (error) {
    console.error("获取用户失败:", error);
    return { success: false, error: "获取用户失败" };
  }
}

// 创建新用户
export async function createAdminUser({
  username,
  password,
  name,
  role,
}: {
  username: string;
  password: string;
  name?: string;
  role?: string;
}) {
  try {
    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) return { success: false, error: "用户名已存在" };

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.adminUser.create({
      data: { username, password: hashed, name, role: role || "admin" },
    });
    return { success: true, data: user };
  } catch (error) {
    console.error("创建用户失败:", error);
    return { success: false, error: "创建用户失败" };
  }
}

// 更新用户信息（可修改密码/昵称/角色）
export async function updateAdminUser({
  id,
  password,
  name,
  role,
}: {
  id: string;
  password?: string;
  name?: string;
  role?: string;
}) {
  try {
    const data: any = {};
    if (password) data.password = await bcrypt.hash(password, 10);
    if (name) data.name = name;
    if (role) data.role = role;

    const user = await prisma.adminUser.update({ where: { id }, data });
    return { success: true, data: user };
  } catch (error) {
    console.error("更新用户失败:", error);
    return { success: false, error: "更新用户失败" };
  }
}

// 删除用户
export async function deleteAdminUser(id: string) {
  try {
    await prisma.adminUser.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("删除用户失败:", error);
    return { success: false, error: "删除用户失败" };
  }
}

// 登录验证
export async function loginAdminUser({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  try {
    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (!user) return { success: false, error: "用户名或密码错误" };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { success: false, error: "用户名或密码错误" };

    return {
      success: true,
      data: { id: user.id, username: user.username, name: user.name, role: user.role },
    };
  } catch (error) {
    console.error("登录失败:", error);
    return { success: false, error: "登录失败" };
  }
}
