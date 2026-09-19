import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Account, STAGES } from "@/lib/types";
import { IndustryPie, StageBar } from "./dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function envReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getAccounts(): Promise<Account[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("accounts").select("*");
  if (error) throw new Error(error.message);
  return data as Account[];
}

export default async function DashboardPage() {
  if (!envReady()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-3xl font-bold tracking-tight">生态商机雷达</h1>
        <p className="max-w-xl text-center text-muted-foreground">
          尚未配置 Supabase。请复制 .env.example 为 .env.local 并填入密钥，
          执行 supabase/migrations/0001_init.sql 后运行 pnpm import:seed。
        </p>
      </main>
    );
  }

  const accounts = await getAccounts();
  const stageData = STAGES.map((s) => ({
    name: s,
    value: accounts.filter((a) => a.stage === s).length,
  }));
  const industryMap = new Map<string, number>();
  for (const a of accounts) {
    const k = a.industry ?? "其他";
    industryMap.set(k, (industryMap.get(k) ?? 0) + 1);
  }
  const industryData = [...industryMap.entries()].map(([name, value]) => ({ name, value }));
  const top20 = [...accounts]
    .filter((a) => a.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 20);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-bold">仪表盘</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stageData.map((s) => (
          <Card key={s.name}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{s.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">行业分布（共 {accounts.length} 家）</CardTitle>
          </CardHeader>
          <CardContent>
            <IndustryPie data={industryData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline 各阶段数量</CardTitle>
          </CardHeader>
          <CardContent>
            <StageBar data={stageData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 20 高分账户</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>公司</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>总部</TableHead>
                <TableHead className="text-right">总分</TableHead>
                <TableHead>阶段</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top20.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Link href={`/accounts/${a.id}`} className="font-medium hover:underline">
                      {a.name_zh}
                    </Link>
                  </TableCell>
                  <TableCell>{a.sub_industry ?? a.industry}</TableCell>
                  <TableCell>{a.hq_location}</TableCell>
                  <TableCell className="text-right font-semibold">{a.score}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.stage}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
