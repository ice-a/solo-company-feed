import LoginForm from "./login-form";

export const metadata = {
  title: "登录 - Push Info"
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-100">
      <h1 className="text-2xl font-semibold text-slate-900">管理员登录</h1>
      <p className="mt-2 text-sm text-slate-600">
        输入后台口令即可发布/统计。口令保存在服务器的环境变量 ADMIN_PASS。
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
