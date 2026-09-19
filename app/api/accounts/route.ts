import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { computeScore } from "@/lib/scoring";

const createAccountSchema = z.object({
  name_zh: z.string().min(1),
  name_en: z.string().optional(),
  industry: z.string().optional(),
  sub_industry: z.string().optional(),
  hq_location: z.string().optional(),
  size_signal: z.string().optional(),
  dev_team_signal: z.number().int().min(0).max(5).nullish(),
  overseas_signal: z.number().int().min(0).max(5).nullish(),
  digital_stage: z.number().int().min(0).max(5).nullish(),
  ai_adoption: z.number().int().min(0).max(5).nullish(),
  hypothesis: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const body = createAccountSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  const { source_url, ...rest } = body.data;
  const dims = {
    dev_team_signal: rest.dev_team_signal ?? null,
    overseas_signal: rest.overseas_signal ?? null,
    digital_stage: rest.digital_stage ?? null,
    ai_adoption: rest.ai_adoption ?? null,
  };
  const record = {
    ...rest,
    ...dims,
    score: computeScore(dims),
    signals: source_url
      ? [{ source_url, excerpt: "手动录入", date: new Date().toISOString().slice(0, 10) }]
      : [],
  };

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("accounts").insert(record).select().single();
  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
