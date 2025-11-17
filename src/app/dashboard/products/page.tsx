"use client";

import React, { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct
} from "@/app/actions/product.action";
import { getCategories } from "@/app/actions/category.action";
import UTUpload from "@/components/UTUpload";

type VariantForm = {
  id?: string;
  size: string;
  color: string;
  stock: number;
};

export default function ProductPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);

  // 表单区域
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    mainImage: "",
    images: [] as string[],
    categoryId: "",
  });

  const [variantList, setVariantList] = useState<VariantForm[]>([
    { size: "", color: "", stock: 0 }
  ]);

  const loadProducts = async () => {
    setLoading(true);
    const res = await getProducts({ search, categoryId, page });
    setProducts(res?.data?.products || []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const res = await getCategories({});
    setCategories(res?.data?.categories || []);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      description: "",
      price: "",
      mainImage: "",
      images: [],
      categoryId: "",
    });
    setVariantList([{ size: "", color: "", stock: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      price: Number(form.price),
      variants: variantList.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: Number(v.stock)
      }))
    };


    if (editId) {
      await updateProduct({ id: editId, ...payload });
    } else {
      await createProduct(payload);
    }

    resetForm();
    setShowForm(false);
    await loadProducts();
    setLoading(false);
  };

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      mainImage: p.mainImage,
      images: p.images || [],
      categoryId: p.category.id,
    });
    setVariantList(p.variants || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除该商品？")) return;
    await deleteProduct(id);
    await loadProducts();
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [search, categoryId, page]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ✅ 主内容 */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">商品管理</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded shadow"
            onClick={() => setShowForm(true)}
          >
            新建商品
          </button>
        </div>

        {/* 🔍 搜索区 */}
        <div className="flex gap-3 mb-4 flex-col md:flex-row">
          <input
            type="text"
            placeholder="搜索商品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <select
            className="border px-3 py-2 rounded w-full md:w-48"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">全部类别</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 🔄 加载状态 */}
        {loading ? (
          <p className="text-center text-gray-500">加载中...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white shadow rounded p-4 flex flex-col">
                <img src={p.mainImage} className="w-full h-40 object-cover rounded mb-3" />
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-gray-500 text-sm">{p.category?.name}</p>
                <p className="text-lg my-2 font-semibold text-blue-600">￥{p.price}</p>

                <div className="mt-auto flex justify-between text-sm">
                  <button className="text-blue-500" onClick={() => handleEdit(p)}>编辑</button>
                  <button className="text-red-500" onClick={() => handleDelete(p.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ 商品编辑对话框（超简洁，美观） */}
        {/* ======================= */}
        {/*      商品编辑抽屉       */}
        {/* ======================= */}
        {showForm && (
          <div className="fixed inset-0 flex">
            {/* 半透明背景 */}
            <div
              className="flex-1 bg-black/40"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            />

            {/* 抽屉内容 */}
            <div
              className="
        bg-white 
        w-full 
        sm:w-[480px] 
        h-full 
        p-6 
        shadow-xl 
        animate-slideLeft
        overflow-y-auto
      "
            >
              <h3 className="font-bold text-xl mb-4">
                {editId ? "编辑商品" : "新建商品"}
              </h3>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* 名称 */}
                <input
                  className="border p-2 w-full rounded"
                  placeholder="商品名称"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />

                {/* 描述 */}
                <textarea
                  className="border p-2 w-full rounded"
                  placeholder="描述"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                {/* 价格 */}
                <input
                  className="border p-2 w-full rounded"
                  type="number"
                  placeholder="价格"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />

                {/* 主图 */}
                <div>
                  <p className="font-semibold mb-1">主图</p>
                  {form.mainImage && (
                    <img
                      src={form.mainImage}
                      className="w-32 h-32 object-cover rounded border mb-2"
                    />
                  )}
                  <UTUpload
                    text="上传主图"
                    onUploaded={(url) => setForm({ ...form, mainImage: url })}
                  />
                </div>

                {/* 附加图片 */}
                <div>
                  <p className="font-semibold mb-1">附加图片</p>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded"
                          onClick={() =>
                            setForm({
                              ...form,
                              images: form.images.filter((_, i) => i !== index),
                            })
                          }
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>

                  <UTUpload
                    text="添加附图"
                    onUploaded={(url) =>
                      setForm((prev) => ({ ...prev, images: [...prev.images, url] }))
                    }
                  />
                </div>

                {/* 类别 */}
                <select
                  className="border p-2 w-full rounded"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">选择类别</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* 变体 */}
                <div>
                  <p className="font-semibold mb-1">商品规格 / 库存</p>

                  {variantList.map((v, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 mb-2 items-center">
                      <input
                        className="border p-2 rounded"
                        placeholder="尺寸"
                        value={v.size}
                        onChange={(e) => {
                          const list = [...variantList];
                          list[i].size = e.target.value;
                          setVariantList(list);
                        }}
                      />

                      <input
                        className="border p-2 rounded"
                        placeholder="颜色"
                        value={v.color}
                        onChange={(e) => {
                          const list = [...variantList];
                          list[i].color = e.target.value;
                          setVariantList(list);
                        }}
                      />

                      <input
                        type="number"
                        className="border p-2 rounded"
                        placeholder="库存"
                        value={v.stock}
                        onChange={(e) => {
                          const list = [...variantList];
                          list[i].stock = Number(e.target.value);
                          setVariantList(list);
                        }}
                      />

                      {/* 删除变体按钮 */}
                      <button
                        type="button"
                        className="text-red-500 text-sm"
                        onClick={() => {
                          if (confirm("确认删除此规格？")) {
                            setVariantList((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            );
                          }
                        }}
                      >
                        删除
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="text-blue-500 mt-1"
                    onClick={() =>
                      setVariantList((prev) => [
                        ...prev,
                        { size: "", color: "", stock: 0 },
                      ])
                    }
                  >
                    + 添加规格
                  </button>
                </div>

                {/* 底部按钮 */}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="text-gray-600"
                  >
                    取消
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
