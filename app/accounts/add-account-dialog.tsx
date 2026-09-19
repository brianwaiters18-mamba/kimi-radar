"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/types";

export function AddAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(typeof error === "string" ? error : "创建失败");
      }
      toast.success("账户已添加");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>手动新增</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增账户</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input name="name_zh" placeholder="公司中文名 *" required />
          <Input name="name_en" placeholder="公司英文名" />
          <Select name="industry">
            <SelectTrigger>
              <SelectValue placeholder="行业" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name="sub_industry" placeholder="细分行业（如：消费电子）" />
          <Input name="hq_location" placeholder="总部城市" />
          <Input name="hypothesis" placeholder="一句话商业化假设" />
          <Input name="source_url" placeholder="来源 URL" type="url" />
          <Button type="submit" disabled={loading}>
            {loading ? "提交中…" : "保存"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
