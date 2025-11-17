// app/page.tsx (更新 handleOrderSubmit 以跳转到订单详情页)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories } from "@/app/actions/category.action"
import { getProducts } from '@/app/actions/product.action'; // 导入服务器动作
import { createOrder } from "@/app/actions/order.action"
import { getConfig } from "@/app/actions/config.action"; // 新增：导入配置接口
import Loader from "@/components/Loader"; // 新增：导入 Loader 组件
import { Carousel } from '@/components/Carousel';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { Cart } from '@/components/Cart';
import { CheckoutModal } from '@/components/CheckoutModal';
import type { Category } from '@prisma/client'; // 假设类型定义
import type { CartItem } from '@/components/Cart';
import { Footer } from '@/components/Footer';
import toast from 'react-hot-toast';
import { checkDailyOrderLimit, incrementDailyOrderCount } from '@/utils/orderUtils';

// 定义扩展的 Product 类型（基于 getProducts 返回的格式化数据）
interface ExtendedProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  mainImage: string;
  images: string[];
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants: {
    id: string;
    size: string;
    color: string;
    stock: number;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

// 定义 CreateOrderInput 类型
interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  address: string;
  items: {
    variantId: string;
    quantity: number;
  }[];
}

// 保存用户信息到 localStorage
function saveUserInfo(info: { customerName: string; customerPhone: string; address: string }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userShippingInfo', JSON.stringify(info));
  }
}

// 保存订单历史到 localStorage
function saveOrderHistory(order: any) {
  if (typeof window !== 'undefined') {
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    history.unshift(order); // 添加到开头（最新订单在前）
    localStorage.setItem('orderHistory', JSON.stringify(history));
  }
}

// 获取用户信息从 localStorage
function getUserInfo() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('userShippingInfo');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
}

// 获取订单历史从 localStorage
function getOrderHistory() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('orderHistory');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
}

// 清除所有本地缓存
function clearLocalCache() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userShippingInfo');
    localStorage.removeItem('orderHistory');
  }
}

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null); // 新增：配置状态
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 新增：初始加载状态
  const hasShownAnnouncement = useRef(false); // 新增 ref，标记是否已显示
  const router = useRouter();

  // 加载初始数据（新增配置加载）
  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true); // 开始加载
      try {
        const [catRes, prodRes, configRes] = await Promise.all([
          getCategories({ page: 1, pageSize: 20 }),
          getProducts({ page: 1, pageSize: 12 }),
          getConfig()
        ]);
        if (catRes.success) {
          setCategories(catRes.data?.categories || []);
        }
        if (prodRes.success) {
          setProducts(prodRes.data?.products || []);
        }
        if (configRes.success) {
          setConfig(configRes.data);
          // 如果有公告，用 toast 显示（延长显示时间）
          if (configRes.data.announcement && !hasShownAnnouncement.current) {
            toast.success(configRes.data.announcement, { duration: 2000 });
            hasShownAnnouncement.current = true; // 标记已显示
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        toast.error('加载数据失败，请刷新重试');
      } finally {
        setIsInitialLoading(false); // 加载完成
      }
    };
    loadData();
  }, []);

  // 加载/保存购物车到 localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      console.log('Attempting to load cart from localStorage:', saved); // 调试 log
      if (saved) {
        const parsedCart = JSON.parse(saved);
        console.log('Parsed cart:', parsedCart); // 调试 log
        setCart(Array.isArray(parsedCart) ? parsedCart : []); // 确保是数组
      } else {
        console.log('No saved cart found'); // 调试 log
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      // Fallback: 清空无效数据
      localStorage.removeItem('cart');
      setCart([]);
      toast.error('购物车数据损坏，已重置');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && cart.length > 0) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Saved cart to localStorage:', cart); // 调试 log
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [cart]);

  const handleCategorySelect = async (id: string) => {
    try {
      // 如果点击的是当前选中的类别，重置为所有商品
      if (selectedCategory === id) {
        setSelectedCategory('');
        const res = await getProducts({ page: 1, pageSize: 20 });
        if (res.success) {
          setProducts(res.data?.products || []);
        }
        return;
      }

      setSelectedCategory(id);
      const res = await getProducts({ categoryId: id, page: 1, pageSize: 20 });
      console.log("res:", res);
      if (res.success) {
        setProducts(res.data?.products || []);
      } else {
        console.error('获取商品失败:', res.error);
        alert('加载商品失败: ' + res.error);
      }
    } catch (error) {
      console.error('handleCategorySelect 错误:', error);
      alert('加载分类商品失败');
    }
  };

  const handleProductSelect = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setSelectedProduct(product);
    } else {
      console.error('未找到商品:', id);
    }
  };

  const addToCart = (variantId: string, quantity: number) => {
    const product = products.find((p) => p.variants.some((v) => v.id === variantId));
    if (!product) {
      alert('商品不存在');
      return;
    }

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || variant.stock < quantity) {
      alert('库存不足');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.variantId === variantId);
    if (existingIndex > -1) {
      const newQuantity = cart[existingIndex].quantity + quantity;
      if (newQuantity > variant.stock) {
        alert('超过可用库存');
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQuantity };
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          variantId,
          name: product.name,
          size: variant.size,
          color: variant.color,
          price: product.price,
          quantity,
          image: product.mainImage,
        },
      ]);
    }
    setSelectedProduct(null);
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.variantId !== variantId));
      return;
    }
    const variant = products.flatMap((p) => p.variants).find((v) => v.id === variantId);
    if (variant && quantity > variant.stock) {
      alert('超过可用库存');
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    setShowCheckout(true);
  };

  // app/page.tsx (更新 handleOrderSubmit 以跳转到订单详情页) - 只更新 handleOrderSubmit 部分
  const handleOrderSubmit = async (input: CreateOrderInput) => {
    // 检查每日订单限制
    const limitCheck = checkDailyOrderLimit();
    if (!limitCheck.canOrder) {
      toast.error(limitCheck.message || '订单提交失败：今日订单已达上限');
      return;
    }

    setLoading(true);
    try {
      const res = await createOrder(input);
      if (res.success) {
        // 清空购物车状态
        setCart([]);
        // 显式清空 localStorage 中的购物车（优化：确保持久化数据也清空）
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart');
        }
        // 保存用户信息到 localStorage
        saveUserInfo(input);
        // 保存订单历史到 localStorage
        saveOrderHistory(res.data);
        // 更新每日计数
        incrementDailyOrderCount();
        toast.success(`订单提交成功！剩余今日订单额度: ${limitCheck.remaining - 1}单`);
        // 跳转到订单详情页，假设路由为 /orders/[id]
        router.push(`/orders/${res.data.id}`);
      } else {
        toast.error(res.error || '订单提交失败');
      }
    } catch (error) {
      console.error('订单提交错误:', error);
      toast.error('订单提交失败');
    }
    setLoading(false);
    setShowCheckout(false);
  };

  // 示例轮播图（从配置中读取，如果有的话）
  const bannerImages = config?.carouselImages?.length > 0
    ? config.carouselImages
    : ['https://images.unsplash.com/photo-1761839257864-c6ccab7238de?ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNXx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=500', 'https://images.unsplash.com/photo-1762424361036-ec4c08265053?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw3fHx8ZW58MHx8fHx8&auto=format&fit=crop&q=60&w=500', 'https://images.unsplash.com/photo-1762430259780-28ffac74916c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyM3x8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=500']; // 替换为实际

  // 获取选中类别的描述
  const selectedCategoryInfo = categories.find(c => c.id === selectedCategory);

  // 如果初始加载中，显示 Loader
  if (isInitialLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {config?.storeName || 'E-Shop'}
          </h1>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="搜索商品..."
              className="hidden md:block p-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 text-gray-700 hover:text-blue-500"
              aria-label="打开购物车"
            >
              🛒
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <Carousel images={bannerImages} />
      </section>

      {/* Categories Section - 横向滚动菜单（固定大小、无描述） */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">按类别购物</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
          {/* "全部" 作为第一个选项 */}
          <CategoryCard
            key="all"
            category={{ id: '', name: '全部', image: 'https://plus.unsplash.com/premium_vector-1724163333366-dc150b75f069?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=880' } as Category}
            onClick={() => handleCategorySelect('')}
            isSelected={!selectedCategory}
          />
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={handleCategorySelect}
              isSelected={selectedCategory === category.id}
            />
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
          {selectedCategory
            ? `${categories.find((c) => c.id === selectedCategory)?.name || ''} 分类商品`
            : '精选商品'}
        </h2>
        {/* 选中类别时渲染描述 */}
        {selectedCategory && selectedCategoryInfo && selectedCategoryInfo.description && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700 leading-relaxed">{selectedCategoryInfo.description}</p>
          </div>
        )}
        {products.length === 0 && selectedCategory && (
          <p className="text-center text-gray-500">该分类下暂无商品</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onClick={handleProductSelect} />
          ))}
        </div>
      </section>

      {/* Footer - 传入配置数据 */}
      <Footer config={config} />

      {/* Modals & Overlays */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
      {showCart && (
        <Cart
          cart={cart}
          onUpdate={updateCartQuantity}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
          onClose={() => setShowCart(false)}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleOrderSubmit}
        />
      )}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">正在处理您的订单...</div>
        </div>
      )}
    </div>
  );
};

export default HomePage;