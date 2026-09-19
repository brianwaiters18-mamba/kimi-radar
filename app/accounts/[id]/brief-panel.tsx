"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brief } from "@/lib/types";

export function BriefPanel({
  accountId,
  briefs,
}: {
  accountId: string;
  briefs: Brief[];
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(briefs[0]?.id ?? null);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "生成失败");
      toast.success("双语简报已生成并存档");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(content: string) {
    await navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={generate} disabled={generating}>
          {generating ? "生成中…（双语约 3–5 分钟，请勿关闭页面）" : "生成双语外联简报（Kimi）"}
        </Button>
      </div>

      {briefs.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无简报 —— 点击上方按钮生成。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {briefs.map((b) => (
            <li key={b.id} className="rounded-lg border">
              <button
                type="button"
                onClick={() => setOpenId(openId === b.id ? null : b.id)}
                className="flex w-full items-center gap-2 p-3 text-left text-sm"
              >
                <Badge variant="secondary">{b.lang === "zh" ? "中文" : "EN"}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(b.created_at).toLocaleString("zh-CN")} · {b.model}
                </span>
                <span className="ml-auto text-xs">{openId === b.id ? "收起 ▲" : "展开 ▼"}</span>
              </button>
              {openId === b.id && (
                <div className="border-t p-4">
                  <div className="mb-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => copy(b.content_md)}>
                      一键复制
                    </Button>
                  </div>
                  <article className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{b.content_md}</ReactMarkdown>
                  </article>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
