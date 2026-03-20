import LoginForm from "./login-form";

export const metadata = {
  title: "登录 - OPC Solo Feed"
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-100">
      <h1 className="text-2xl font-semibold text-slate-900">登录</h1>
      <p className="mt-2 text-sm text-slate-600">
        登录后可以发布内容、修改自己的内容，并查看个人统计。
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-slate-500">
        还没有账号？{" "}
        <a href="/register" className="text-brand-600 hover:text-brand-700">
          立即注册
        </a>
      </p>
    </div>
  );
}
