import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { computeScore } from "@/lib/scoring";
import { STAGES } from "@/lib/types";

const patchSchema = z.object({
  name_zh: z.string().min(1).optional(),
  name_en: z.string().nullish(),
  industry: z.string().nullish(),
  sub_industry: z.string().nullish(),
  hq_location: z.string().nullish(),
  size_signal: z.string().nullish(),
  dev_team_signal: z.number().int().min(0).max(5).nullish(),
  overseas_signal: z.number().int().min(0).max(5).nullish(),
  digital_stage: z.number().int().min(0).max(5).nullish(),
  ai_adoption: z.number().int().min(0).max(5).nullish(),
  hypothesis: z.string().nullish(),
  fit_products: z.array(z.string()).nullish(),
  stage: z.enum(STAGES).optional(),
  stage_note: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  const { stage, stage_note, ...fields } = body.data;

  const supabase = getSupabaseServiceClient();
  const { data: current, error: fetchError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !current) {
    return NextResponse.json({ error: "账户不存在" }, { status: 404 });
  }

  // 维度分变化时自动重算总分（未提供的维度沿用现值）
  const dims = {
    dev_team_signal: fields.dev_team_signal !== undefined ? fields.dev_team_signal : current.dev_team_signal,
    overseas_signal: fields.overseas_signal !== undefined ? fields.overseas_signal : current.overseas_signal,
    digital_stage: fields.digital_stage !== undefined ? fields.digital_stage : current.digital_stage,
    ai_adoption: fields.ai_adoption !== undefined ? fields.ai_adoption : current.ai_adoption,
  };

  const update: Record<string, unknown> = { ...fields, score: computeScore(dims) };
  if (stage) update.stage = stage;

  const { data: updated, error: updateError } = await supabase
    .from("accounts")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (stage && stage !== current.stage) {
    await supabase.from("pipeline_events").insert({
      account_id: id,
      from_stage: current.stage,
      to_stage: stage,
      note: stage_note ?? null,
    });
  }

  return NextResponse.json(updated);
}
