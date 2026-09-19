"use client";

import { useState } from "react";
import Link from "next/link";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Account, Stage, STAGES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function AccountCard({ account }: { account: Account }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: account.id,
  });
  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab p-3 text-sm ${isDragging ? "z-50 opacity-70 shadow-lg" : ""}`}
    >
      <Link
        href={`/accounts/${account.id}`}
        className="font-medium hover:underline"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {account.name_zh}
      </Link>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{account.sub_industry ?? account.industry}</span>
        <Badge variant="secondary">{account.score ?? "—"}</Badge>
      </div>
    </Card>
  );
}

function StageColumn({ stage, accounts }: { stage: Stage; accounts: Account[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-96 w-56 shrink-0 flex-col gap-2 rounded-xl border bg-muted/40 p-2 transition-colors ${isOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : ""}`}
    >
      <div className="flex items-center justify-between px-1 py-1 text-sm font-medium">
        {stage}
        <Badge variant="outline">{accounts.length}</Badge>
      </div>
      {accounts.map((a) => (
        <AccountCard key={a.id} account={a} />
      ))}
    </div>
  );
}

export function KanbanBoard({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as Stage;
    const account = accounts.find((a) => a.id === active.id);
    if (!account || account.stage === newStage) return;

    const prev = accounts;
    setAccounts((cur) => cur.map((a) => (a.id === account.id ? { ...a, stage: newStage } : a)));
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("保存失败");
      toast.success(`${account.name_zh} → ${newStage}`);
    } catch {
      setAccounts(prev);
      toast.error("阶段保存失败，已还原");
    }
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            accounts={accounts.filter((a) => a.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
