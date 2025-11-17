"use client";

import React, { useState, useRef } from "react";
import { UploadButton } from "@/utils/uploadthing";
import toast from "react-hot-toast";

export default function UTUpload({
  text = "点击上传图片",
  onUploaded,
  timeout = 12000, // 默认 12 秒超时，可自定义
}: {
  text?: string;
  onUploaded: (url: string) => void;
  timeout?: number;
}) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error" | "timeout"
  >("idle");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = (s: typeof status) => {
    setStatus(s);

    // 自动恢复 idle 状态
    if (s !== "uploading") {
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const startTimeoutTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      updateStatus("timeout");
      toast.error("上传超时，请检查网络后重试");
    }, timeout);
  };

  const clearTimeoutTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const isDisabled = status === "uploading";

  const getButtonText = () => {
    switch (status) {
      case "uploading":
        return "上传中...";
      case "success":
        return "上传成功 ✓";
      case "error":
        return "上传失败";
      case "timeout":
        return "上传超时";
      default:
        return text;
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case "uploading":
        return "!bg-gray-400 cursor-not-allowed";
      case "success":
        return "!bg-green-500 hover:!bg-green-600";
      case "error":
      case "timeout":
        return "!bg-red-500 hover:!bg-red-600";
      default:
        return "!bg-blue-500 hover:!bg-blue-600";
    }
  };

  return (
    <div>
      <UploadButton
        endpoint="imageUploader"
        disabled={isDisabled}
        onUploadBegin={() => {
          updateStatus("uploading");
          startTimeoutTimer(); // ⏱ 开始计时
        }}
        onClientUploadComplete={(res) => {
          clearTimeoutTimer(); // 任务完成 → 清除超时计时器

          const url = res?.[0]?.url;
          if (url) {
            onUploaded(url);
            updateStatus("success");
          } else {
            updateStatus("error");
          }
        }}
        onUploadError={() => {
          clearTimeoutTimer();
          updateStatus("error");
        }}
        appearance={{
          button: `
            ${getButtonColor()}
            !text-white 
            !px-4 
            !py-2 
            !rounded-lg 
            !shadow 
            transition 
            text-sm
            min-w-[120px]
          `,
        }}
        content={{
          button: () => getButtonText(),
        }}
      />
    </div>
  );
}
