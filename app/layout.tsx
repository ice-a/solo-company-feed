import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { cookieName, getAdminName, verifySession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "OPC Solo Feed",
  description: "轻量信息流发布平台，支持 Markdown 与多端浏览。"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const token = cookies().get(cookieName)?.value;
  const session = await verifySession(token);
  const userName = session?.name ?? getAdminName();

  return (
    <html lang="zh-CN">
      <body className="text-slate-900 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="rounded-xl bg-brand-100 px-2 py-1 text-xs font-bold uppercase text-brand-700">
                Solo
              </span>
              <span>solo-feed</span>
            </Link>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <nav className="flex items-center gap-3">
                <Link href="/" className="hover:text-brand-600">
                  首页
                </Link>
                <Link href="/tags" className="hover:text-brand-600">
                  标签
                </Link>
                <Link href="/admin" className="hover:text-brand-600">
                  后台
                </Link>
              </nav>
              {session ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {userName}
                </span>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:text-brand-600"
                >
                  登录
                </Link>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
            <span>素材来自 img.020417.xyz</span>
            <span>为朋友制作 · {new Date().getFullYear()}</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
