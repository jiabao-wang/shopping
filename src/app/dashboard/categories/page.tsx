"use client";

import React, { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/category.action";
import toast from "react-hot-toast";
import UTUpload from "@/components/UTUpload"; // ← 记得路径改成你自己的

export default function CategoryPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    const res = await getCategories({ search });
    setCategories(res?.data?.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editId) {
      await updateCategory({
        id: editId,
        name: form.name,
        description: form.description,
        image: form.image,
      });
      toast.success("类别更新成功");
      setEditId(null);
    } else {
      await createCategory({
        name: form.name,
        desp: form.description,
        image: form.image,
      });
      toast.success("类别创建成功");
    }

    setForm({ name: "", description: "", image: "" });
    await loadCategories();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该类别吗？")) return;

    setLoading(true);
    await deleteCategory(id);
    toast.success("类别已删除");
    await loadCategories();
    setLoading(false);
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      image: cat.image || "",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-3 sm:p-6">
      <main className="flex-1 w-full max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">
          类别管理
        </h2>

        {/* 表单 */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white p-4 rounded-lg shadow space-y-4"
        >
          <input
            type="text"
            placeholder="类别名称"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
            required
          />

          <input
            type="text"
            placeholder="类别描述"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="border rounded px-3 py-2 w-full"
          />

          {/* 图片上传（用 UTUpload） */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* 预览图 */}
            {form.image ? (
              <img
                src={form.image}
                alt="封面"
                className="w-24 h-24 rounded object-cover border"
              />
            ) : (
              <div className="w-24 h-24 border rounded flex items-center justify-center text-gray-400 text-sm">
                无图
              </div>
            )}

            {/* 上传按钮 */}
            <div className="flex flex-col gap-2">
              <UTUpload
                text="上传类别封面"
                onUploaded={(url) => {
                  setForm((f) => ({ ...f, image: url }));
                  toast.success("图片上传成功");
                }}
              />
              <p className="text-xs text-gray-500">支持 jpg/png/webp 格式</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow disabled:opacity-60"
            >
              {editId ? "保存修改" : "新建类别"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", description: "", image: "" });
                }}
                className="text-gray-500"
              >
                取消编辑
              </button>
            )}
          </div>
        </form>

        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索类别..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 w-full mb-3 rounded"
        />

        {/* 列表 */}
        {loading ? (
          <div className="text-center text-gray-600 py-6">加载中...</div>
        ) : (
          <ul className="bg-white shadow rounded divide-y">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-col sm:flex-row justify-between sm:items-center p-3 gap-3"
              >
                <div className="flex items-center gap-3">
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-gray-500 text-sm">{cat.description}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => handleEdit(cat)}
                  >
                    编辑
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDelete(cat.id)}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
