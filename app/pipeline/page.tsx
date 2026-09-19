import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Account } from "@/lib/types";
import { KanbanBoard } from "./kanban-board";

export const dynamic = "force-dynamic";

async function getAccounts(): Promise<Account[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data as Account[];
}

export default async function PipelinePage() {
  const accounts = await getAccounts();
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Pipeline 看板</h1>
      {accounts.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          暂无数据 —— 先导入种子账户。
        </p>
      ) : (
        <KanbanBoard initialAccounts={accounts} />
      )}
    </main>
  );
}
