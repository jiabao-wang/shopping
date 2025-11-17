"use client";

import React, { useEffect, useState } from "react";
import { getConfig, updateConfig } from "@/app/actions/config.action";
import UTUpload from "@/components/UTUpload";

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    storeName: "",
    storeLogo: "",
    storeDescription: "",
    carouselImages: [],
    announcement: "",
    address: "",
    postalCode: "",
    phone: "",
    email: "",
    workHours: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const res = await getConfig();
    if (res.success) {
      const c = res.data;
      setConfigId(c.id);
      setForm({
        ...c,
        carouselImages: Array.isArray(c.carouselImages)
          ? c.carouselImages
          : [],
      });
    }
    setLoading(false);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await updateConfig({
      ...form,
      carouselImages: form.carouselImages,
    });

    if (res.success) {
      alert("配置已保存");
      await loadConfig();
    } else {
      alert(res.error || "保存失败");
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow space-y-6">

        <h2 className="text-2xl font-bold text-center sm:text-left">
          商店配置管理
        </h2>

        <form className="space-y-5" onSubmit={saveConfig}>

          {/* 店铺名称 */}
          <Input label="商店名称" name="storeName" value={form.storeName} onChange={handleChange} required />

          {/* LOGO 上传 */}
          <div>
            <label className="block mb-1 font-medium">商店 Logo</label>
            {form.storeLogo && (
              <div className="mb-3 flex justify-center">
                <img
                  src={form.storeLogo}
                  alt="logo"
                  className="w-24 h-24 rounded object-cover border"
                />
              </div>
            )}

            <UTUpload
              text="上传 Logo"
              onUploaded={(url) =>
                setForm((f: any) => ({ ...f, storeLogo: url }))
              }
            />
          </div>

          {/* 商店简介 */}
          <TextArea
            label="商店简介"
            name="storeDescription"
            value={form.storeDescription}
            onChange={handleChange}
          />

          {/* 轮播图上传 */}
          <div>
            <label className="block mb-1 font-medium">首页轮播图</label>

            {/* 图片预览 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {form.carouselImages.map((img: string, idx: number) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                    onClick={() =>
                      setForm((f: any) => ({
                        ...f,
                        carouselImages: f.carouselImages.filter(
                          (_: any, i: number) => i !== idx
                        ),
                      }))
                    }
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>

            <UTUpload
              text="上传轮播图"
              onUploaded={(url) =>
                setForm((f: any) => ({
                  ...f,
                  carouselImages: [...f.carouselImages, url],
                }))
              }
            />
          </div>

          {/* 其他字段 */}
          <TextArea label="首页公告" name="announcement" value={form.announcement} onChange={handleChange} />
          <Input label="店铺地址" name="address" value={form.address} onChange={handleChange} />
          <Input label="邮编" name="postalCode" value={form.postalCode} onChange={handleChange} />
          <Input label="电话" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="邮箱" name="email" value={form.email} onChange={handleChange} />
          <Input label="工作时间" name="workHours" value={form.workHours} onChange={handleChange} />

          <div className="flex justify-center sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              {saving ? "保存中..." : "保存配置"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, required = false }: any) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        className="border rounded w-full px-3 py-2"
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows={3}
        className="border rounded w-full px-3 py-2"
      />
    </div>
  );
}
