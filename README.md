# OPC Solo Feed 信息流

OPC（One Person Company，一人即是公司）信息流项目，用于个人/小团队以“信息流平台”的方式发布动态、记录进展与沉淀内容。

## 功能概览
- 信息流首页：搜索、标签筛选
- 内容详情：Markdown 渲染、分享链接/二维码、阅读统计
- 后台管理：登录、注册、发布/编辑/删除、统计面板
- 登录有效期：24 小时，过期需重新登录

## 技术栈
- Next.js 14（App Router）
- MongoDB Atlas
- Tailwind CSS
- Markdown

## 本地开发
1. 安装依赖
```bash
npm install
```

2. 配置环境变量：新建 `.env.local`
```
MONGODB_URI=你的Mongo连接串
MONGODB_DB=pushinfo
SESSION_SECRET=用于签名的随机长字符串
NEXT_PUBLIC_SITE_URL=https://你的站点域名
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开页面并注册账号
- 注册：`/register`
- 登录：`/login`

## 说明
- 后台入口：`/admin`
- 登录后右上角显示当前用户名
