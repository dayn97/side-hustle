import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const admin = await db.user.upsert({ where: { email: "admin@example.com" }, update: {}, create: { email: "admin@example.com", name: "Inkwell Admin", passwordHash, role: "ADMIN", isMember: true } });
  await db.category.createMany({ data: [{ name: "实践" }, { name: "方法" }, { name: "观察" }], skipDuplicates: true });
  await db.article.upsert({ where: { slug: "build-a-small-online-business" }, update: {}, create: { slug: "build-a-small-online-business", titleZh: "把一个小生意做成系统", titleEn: "Turning a Small Business into a System", excerptZh: "从真实成本、分发和风险开始。", excerptEn: "Start with real costs, distribution, and risk.", contentZh: "这是一个示例文章。你可以在后台创建、编辑和发布自己的内容。\n\nV1 支持中英文正文、标签、分类以及会员专属文章。", contentEn: "This is a sample article. Create, edit, and publish your own content from the dashboard.\n\nV1 supports bilingual content, tags, categories, and member-only articles.", category: "实践", tags: ["创业", "方法"], tagsEn: ["Entrepreneurship", "Practical methods"], isPremium: false, status: "PUBLISHED", authorId: admin.id } });
}
main().finally(() => db.$disconnect());
