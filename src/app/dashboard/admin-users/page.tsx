"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/app/actions/adminUser.action";

export default function AdminUserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "admin",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getAdminUsers();
    if (res.success) setUsers(res.data || []); // 修复：添加 || [] 避免 undefined
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editId) {
      await updateAdminUser({
        id: editId,
        name: form.name,
        role: form.role,
        password: form.password || undefined,
      });
    } else {
      await createAdminUser(form);
    }

    setForm({ username: "", password: "", name: "", role: "admin" });
    setEditId(null);
    await loadUsers();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("确定要删除该用户吗？")) {
      setLoading(true);
      await deleteAdminUser(id);
      await loadUsers();
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditId(user.id);
    setForm({
      username: user.username,
      password: "",
      name: user.name || "",
      role: user.role || "admin",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">后台用户管理</h2>

      {/* 表单 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-4 mb-6 space-y-3"
      >
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="用户名"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
            required
            disabled={!!editId}
          />
          <input
            type="password"
            placeholder={editId ? "新密码（可选）" : "密码"}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
            required={!editId}
          />
          <input
            type="text"
            placeholder="昵称"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="superadmin">超级管理员</option>
            <option value="admin">管理员</option>
            <option value="editor">编辑</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow disabled:opacity-50"
          >
            {editId ? "保存修改" : "创建用户"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ username: "", password: "", name: "", role: "admin" });
              }}
              className="text-gray-500"
            >
              取消编辑
            </button>
          )}
        </div>
      </form>

      {/* 用户列表 */}
      {loading ? (
        <div className="text-center py-6 text-gray-500">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3">用户名</th>
                <th className="p-3">昵称</th>
                <th className="p-3">角色</th>
                <th className="p-3">创建时间</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.name || "-"}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-center space-x-3">
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => handleEdit(u)}
                    >
                      编辑
                    </button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(u.id)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}