import RegisterForm from "./register-form";

export const metadata = {
  title: "注册 - OPC Solo Feed"
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-100">
      <h1 className="text-2xl font-semibold text-slate-900">注册</h1>
      <p className="mt-2 text-sm text-slate-600">
        注册后可以发布和修改自己的内容，默认每个用户每天最多发布 10 条。
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-sm text-slate-500">
        已有账号？{" "}
        <a href="/login" className="text-brand-600 hover:text-brand-700">
          去登录
        </a>
      </p>
    </div>
  );
}
