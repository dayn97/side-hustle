"use client";
import { useState } from "react";

export default function CategoryForm({ initial }: { initial: { id: string; name: string }[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (!response.ok) { setMessage(await response.text()); return; }
    const category = await response.json();
    setItems([...items, category].sort((a, b) => a.name.localeCompare(b.name)));
    setName(""); setMessage("已添加");
  }
  return <div className="card" style={{ marginTop: 36 }}><h2>Categories</h2><form onSubmit={addCategory} style={{ display: "flex", gap: 8, maxWidth: 520 }}><input aria-label="分类名称" placeholder="例如：商业、生活、方法" value={name} onChange={e => setName(e.target.value)} /><button className="button">添加分类</button></form>{message && <p className="meta">{message}</p>}<div style={{ marginTop: 18 }}>{items.map(item => <span className="tag" key={item.id}>#{item.name}</span>)}</div></div>;
}
