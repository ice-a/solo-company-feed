"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const LOGOUT_FAILED_TEXT = "\u9000\u51fa\u767b\u5f55\u5931\u8d25";
const LOGGING_OUT_TEXT = "\u9000\u51fa\u4e2d...";
const LOGOUT_TEXT = "\u9000\u51fa\u767b\u5f55";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || LOGOUT_FAILED_TEXT);
        return;
      }

      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? LOGGING_OUT_TEXT : LOGOUT_TEXT}
    </button>
  );
}
