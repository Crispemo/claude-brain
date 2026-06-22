import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const source = url.searchParams.get("source");
  const sort = url.searchParams.get("sort") || "views";
  const search = url.searchParams.get("q");

  let query = supabase.from("hooks").select("*");
  if (type) query = query.eq("type", type);
  if (source) query = query.eq("source", source);
  if (search) query = query.ilike("text", `%${search}%`);

  const sortColumn = sort === "recent" ? "created_at" : sort === "saves" ? "saves" : "views";
  query = query.order(sortColumn, { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase.from("hooks").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
