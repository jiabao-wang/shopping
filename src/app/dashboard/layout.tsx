"use client";

import { useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, isLoggedIn, logout } from "@/lib/auth"; // 导入工具函数
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // 检查登录状态
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    // 加载用户信息
    const storedUser = getUser();
    setUser(storedUser);
  }, [router]);
  // 如果未登录，直接返回加载中（实际会重定向）
  if (!user) {
    return <Loader/>;
  }
  const logoutToMainView = () => {
    if (logout()) {
      toast.success("退出登陆成功")
      router.push("/");
    } else {
      toast.error("退出登陆失败");
    }
  }

  const menus = [
    { name: "后台首页", path: "/dashboard" },
    { name: "类别管理", path: "/dashboard/categories" },
    { name: "商品管理", path: "/dashboard/products" },
    { name: "订单管理", path: "/dashboard/orders" },
    { name: "商店配置", path: "/dashboard/config" },
    { name: "用户管理", path: "/dashboard/admin-users" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden"> {/* 修改：min-h-screen -> h-screen，确保固定高度占满视口 */}
      {/* ✅ Mobile Drawer 背景遮罩 */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ✅ 左侧菜单 - 桌面端垂直占满屏幕 */}
      <aside
        className={`fixed left-0 top-0 bg-white shadow-md w-64 p-4 z-50 
        transform transition-transform duration-300 will-change-transform
        backface-hidden font-smooth flex flex-col h-screen /* 新增：flex flex-col + h-screen，确保垂直拉伸占满 */
        ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} md:relative md:translate-x-0 md:w-64`}
      >
        <div className="flex-shrink-0"> {/* 新增：菜单标题固定在顶部，不拉伸 */}
          <h2 className="text-lg font-bold mb-6">后台管理系统</h2>
        </div>
        <nav className="flex-1 overflow-y-auto"> {/* 新增：nav 使用 flex-1 拉伸剩余空间，添加滚动以防菜单过长 */}
          <ul className="space-y-2">
            {menus.map((item) => {
              const active = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`block p-2 rounded-lg transition border-b-2
                    ${active ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* 可选：如果需要底部固定元素（如版权），可以加在这里 */}
        <Button variant="outline" onClick={logoutToMainView}>退出登陆</Button>
      </aside>

      {/* ✅ 内容区域 */}
      <div className="flex-1 p-4 md:p-6 ml-0 md:ml-6 overflow-x-hidden w-full max-w-full h-screen overflow-y-auto"> {/* 修改：内容区域也用 h-screen + overflow-y-auto，确保内容滚动不影响菜单 */}

        {/* ✅ 顶部栏（显示菜单按钮 - 手机端） */}
        <div className="mb-4 flex justify-between md:hidden">
          <Button
            variant="outline"
            onClick={() => setMenuOpen(true)}
          >
            菜单
          </Button>
          <Button
            variant="destructive"
            onClick={logoutToMainView}
          >
            退出
          </Button>

        </div>

        {children}
      </div>
    </div>
  );
}