"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "link" | "qr";

export function SharePanel({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("link");
  const [copied, setCopied] = useState(false);

  const safeUrl = useMemo(() => url.trim(), [url]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setTab("link");
    }
  }, [open]);

  async function handleCopy() {
    if (!safeUrl) return;
    try {
      await navigator.clipboard.writeText(safeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      alert("复制失败，请手动复制链接");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:text-brand-600"
      >
        分享
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-20 w-72 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTab("link")}
                className={`rounded-full px-3 py-1 ${tab === "link" ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100" : "text-slate-500 hover:text-brand-600"}`}
              >
                链接
              </button>
              <button
                type="button"
                onClick={() => setTab("qr")}
                className={`rounded-full px-3 py-1 ${tab === "qr" ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100" : "text-slate-500 hover:text-brand-600"}`}
              >
                二维码
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              关闭
            </button>
          </div>

          {tab === "link" ? (
            <div className="mt-4 space-y-3">
              <input
                readOnly
                value={safeUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="w-full rounded-full bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
              >
                {copied ? "已复制" : "复制链接"}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <img
                  src={`/api/qr?url=${encodeURIComponent(safeUrl)}`}
                  alt="QR"
                  className="h-40 w-40"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-500">使用手机扫码打开链接</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
