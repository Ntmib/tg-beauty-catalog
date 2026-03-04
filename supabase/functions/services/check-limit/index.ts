/**
 * GET /functions/v1/services/check-limit
 *
 * Проверяет может ли мастер добавить ещё одну услугу.
 *
 * Ответ:
 *   { can_add: boolean, current: number, limit: number, plan: string }
 *
 * Авторизация: Bearer JWT (мастер)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Лимиты по планам
const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: Infinity,
  premium: Infinity,
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const masterId = getMasterIdFromJwt(req);
    if (!masterId) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Получаем план мастера
    const { data: master } = await supabase
      .from("masters")
      .select("plan")
      .eq("id", masterId)
      .single();

    if (!master) {
      return json({ error: "Master not found" }, 404);
    }

    const plan = master.plan as string;
    const limit = PLAN_LIMITS[plan] ?? 5;

    // Считаем активные услуги (не скрытые лимитом)
    const { count } = await supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("master_id", masterId)
      .eq("is_active", true)
      .eq("is_over_limit", false);

    const current = count ?? 0;
    const canAdd = limit === Infinity || current < limit;

    return json({
      can_add: canAdd,
      current,
      limit: limit === Infinity ? null : limit,
      plan,
    });
  } catch (err) {
    console.error("services/check-limit error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function getMasterIdFromJwt(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.app_master_id ?? null;
  } catch {
    return null;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
