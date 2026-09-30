# Inkwell · 文章发布网站 V1

一个偏 Medium / Substack 风格的中英文图文文章站 MVP。包含注册登录、文章发布/编辑、分类标签、免费/会员文章、会员和打赏订单、Stripe/PayPal webhook 入口、USDT 预留模型、基础后台。

## 本地启动

1. 复制 `.env.example` 为 `.env`，确保 `DATABASE_URL` 指向 PostgreSQL。
2. 安装依赖：`npm install`
3. 初始化数据库：`npm run db:push && npm run db:seed`
4. 启动：`npm run dev`，访问 http://localhost:3000

演示账号：`admin@example.com` / `demo1234`。

文章打赏允许游客创建订单，无需注册或登录；会员购买仍需登录。游客订单的 `userId` 为空，后台显示“游客 / Guest”。未配置支付密钥时，创建的是待支付的 DEMO 订单，不会扣款，也不会显示已付款。

Stripe Checkout 已接入：配置 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET`，并将 Stripe webhook 指向 `/api/payments/webhook/stripe`。只有验签通过的已支付事件才会更新订单。会员为一次性购买 30 天使用期，尚不自动续费。PayPal 结账及 webhook 验证仍为待接入项，不能用于真实收款。

## Docker / VPS

```bash
cp .env.example .env
docker compose up -d db
npm install && npm run db:push && npm run db:seed
npm run build && npm start
```

生产环境建议用 Nginx 反向代理到 `127.0.0.1:3000`，启用 HTTPS，并将 `AUTH_SECRET`、支付密钥和数据库密码替换为随机值。图片 V1 支持外部 URL；接入 R2 时可在 `S3_*` 环境变量基础上新增签名上传接口。

## 支付安全说明

订单使用唯一 `idempotencyKey`；webhook 先以 `(provider,eventId)` 做去重，再在事务中更新订单和会员状态。Stripe webhook 验签已实现；PayPal 入口保留原始 body，生产接入时应使用 PayPal API 校验 transmission headers 后再调用同一套幂等处理。USDT 只保留 provider、订单和网络字段，首版不做链上确认。

## Google 登录

在 [Google Cloud Console](https://console.cloud.google.com/auth/clients) 创建 OAuth 客户端，类型选 **Web 应用**，配置品牌信息和用户范围，权限仅使用 `openid email profile`。

- 生产回调 URI（须精确一致）：`https://www.hustlovis.com/api/auth/google/callback`
- 本地回调 URI：`http://localhost:3000/api/auth/google/callback`
- `NEXT_PUBLIC_APP_URL` 必须设置为访问站点的实际地址；生产环境使用 HTTPS。
- 将客户端 ID 和密钥分别填入 `.env` 的 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`；生产环境必须设置随机 `AUTH_SECRET`。密钥不能放到 `NEXT_PUBLIC_*` 或提交到 Git。
- 测试状态下按 Google 控制台要求添加测试用户；对公众开放时将应用设为生产状态，并按控制台提示完成所需配置。

新安装执行 `docker compose up -d --build app`。已有 V1 数据库升级时，先备份数据库，然后执行 `docker compose exec -T db psql -U inkwell -d inkwell -v ON_ERROR_STOP=1 < prisma/google-login.sql`，再执行 `docker compose up -d --build app`；脚本仅添加可空的 Google 标识列、唯一索引，并允许 Google 用户没有本地密码，保留已有用户密码。仅修改凭证时执行 `docker compose up -d --force-recreate app`，无需重新构建；登录页会在服务器读取凭证配置。缺少凭证时 Google 按钮禁用，邮箱密码登录仍可使用。

首次 Google 登录会创建普通作者账号。账号以 Google `sub` 唯一标识关联；同邮箱已有账号时，必须先用原密码登录，再在个人后台点击“关联 Google 账号”。关联后文章、会员、角色和订单仍保留在原账号。Google 注册的账号没有本地密码，只能用 Google 登录。

回调校验签名、issuer、audience、有效期、已验证邮箱和 nonce；登录请求使用签名的十分钟 Cookie、state 和 PKCE，回调结束即清除流程 Cookie。Google 的访问令牌和刷新令牌不会持久化。安全检查可运行 `npm run test:auth`。
