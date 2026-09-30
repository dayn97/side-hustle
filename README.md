# Inkwell · 文章发布网站 V1

一个偏 Medium / Substack 风格的中英文图文文章站 MVP。包含注册登录、文章发布/编辑、分类标签、免费/会员文章、会员和打赏订单、Stripe/PayPal webhook 入口、USDT 预留模型、基础后台。

## 本地启动

1. 复制 `.env.example` 为 `.env`，确保 `DATABASE_URL` 指向 PostgreSQL。
2. 安装依赖：`npm install`
3. 初始化数据库：`npm run db:push && npm run db:seed`
4. 启动：`npm run dev`，访问 http://localhost:3000

演示账号：`admin@example.com` / `demo1234`。

未配置 Stripe/PayPal 时，页面使用 DEMO provider 创建订单，方便端到端验收。配置密钥后，生产环境应在支付创建接口中替换为真实 checkout session/order，并将供应商 webhook 指向 `/api/payments/webhook/{provider}`。

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
