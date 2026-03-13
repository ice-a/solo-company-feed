# OPC 信息流平台

面向 OPC（One Person Company，一人公司）的轻量信息流发布站。  
个人即公司：记录更新、发布进展、同步给关注你的人；简单、克制、能持续。

## 你会得到什么
- 一个可公开访问的“个人公司动态墙”
- 支持 Markdown 的内容发布
- 文章详情页可长期访问（稳定 URL）
- RSS 订阅与站点地图，方便搜索与关注
- 后台口令发布与统计，维护成本低

## 典型使用场景
- 个人产品更新、周报、交付日志
- 公开路线图、里程碑、版本发布
- 内容实验、灵感记录、对外同步

## 技术栈
- Next.js 14（App Router）
- MongoDB Atlas（免费云数据库）
- Tailwind CSS
- Markdown 渲染

## 快速开始
1. 安装依赖  
```bash
npm install
```

2. 新建 `.env.local`  
```
MONGODB_URI=你的Mongo连接串
MONGODB_DB=pushinfo
ADMIN_PASS=自定义后台口令
SESSION_SECRET=任意长随机字符串
NEXT_PUBLIC_SITE_URL=https://你的域名
```

3. 开发运行  
```bash
npm run dev
```

## 功能清单
- 首页信息流：最新发布置顶
- 文章详情页：Markdown 渲染
- 后台：口令登录、发布、编辑/删除、统计
- 标签聚合页与标签详情页
- 搜索与分页
- RSS：`/rss`（标题：不务正业的木子；文案：less is more）
- Sitemap：`/sitemap.xml`

## 部署建议
- 前端：Vercel
- 数据库：MongoDB Atlas 免费套餐
- 图片：图床（如 `https://img.020417.xyz`）

## 设计原则
- 低摩擦发布
- 少即是多
- 长期可维护

## TODO
- 草稿与置顶
- 私密分享链接
- 全文索引（MongoDB Text Index）
