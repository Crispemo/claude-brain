import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  // If Stripe is connected, sync fresh data first
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { getMonthlyRevenue } = await import("@/lib/stripe");
      const supabase = createAdminClient();
      const months = await getMonthlyRevenue(6);

      for (const m of months) {
        await supabase.from("simulia_metrics").upsert({
          month: m.month,
          revenue: m.revenue,
          new_users: m.new_customers,
          total_users: 0,
        }, { onConflict: "month" });
      }
    } catch (e) {
      console.error("Stripe sync error:", e);
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("simulia_metrics").select("*").order("month", { ascending: false }).limit(12);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase.from("simulia_metrics").upsert(body, { onConflict: "month" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
