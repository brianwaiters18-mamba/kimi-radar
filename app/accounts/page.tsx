import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Account, INDUSTRIES } from "@/lib/types";
import { AddAccountDialog } from "./add-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; industry?: string; sort?: string }>;
}

async function getAccounts(q?: string, industry?: string): Promise<Account[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("accounts")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (q) query = query.or(`name_zh.ilike.%${q}%,name_en.ilike.%${q}%`);
  if (industry) query = query.eq("industry", industry);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Account[];
}

function envReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function AccountsPage({ searchParams }: Props) {
  const { q = "", industry = "" } = await searchParams;

  if (!envReady()) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="mb-4 text-2xl font-bold">账户库</h1>
        <p className="text-muted-foreground">
          尚未配置 Supabase。请复制 .env.example 为 .env.local 并填入
          NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY，然后执行
          supabase/migrations/0001_init.sql 与 pnpm import:seed。
        </p>
      </main>
    );
  }

  const accounts = await getAccounts(q || undefined, industry || undefined);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">账户库（{accounts.length}）</h1>
        <AddAccountDialog />
      </div>

      <form className="mb-4 flex gap-2" action="/accounts">
        <Input name="q" placeholder="搜索公司名（中/英）" defaultValue={q} className="max-w-xs" />
        <select
          name="industry"
          defaultValue={industry}
          className="rounded-md border bg-background px-3 text-sm"
        >
          <option value="">全部行业</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          筛选
        </Button>
      </form>

      {accounts.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          暂无数据 —— 运行 pnpm import:seed 导入种子数据，或点击「手动新增」。
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>公司</TableHead>
              <TableHead>行业</TableHead>
              <TableHead>总部</TableHead>
              <TableHead className="text-center">研发</TableHead>
              <TableHead className="text-center">出海</TableHead>
              <TableHead className="text-center">数字化</TableHead>
              <TableHead className="text-center">AI</TableHead>
              <TableHead className="text-right">总分</TableHead>
              <TableHead>阶段</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Link href={`/accounts/${a.id}`} className="font-medium hover:underline">
                    {a.name_zh}
                  </Link>
                  {a.name_en && (
                    <div className="text-xs text-muted-foreground">{a.name_en}</div>
                  )}
                </TableCell>
                <TableCell>
                  {a.industry}
                  {a.sub_industry && (
                    <div className="text-xs text-muted-foreground">{a.sub_industry}</div>
                  )}
                </TableCell>
                <TableCell>{a.hq_location}</TableCell>
                <TableCell className="text-center">{a.dev_team_signal ?? "—"}</TableCell>
                <TableCell className="text-center">{a.overseas_signal ?? "—"}</TableCell>
                <TableCell className="text-center">{a.digital_stage ?? "—"}</TableCell>
                <TableCell className="text-center">{a.ai_adoption ?? "—"}</TableCell>
                <TableCell className="text-right font-semibold">
                  {a.score ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{a.stage}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
