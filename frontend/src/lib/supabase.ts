const env = import.meta.env as Record<string, string | undefined>;

const supabaseUrl =
  env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ??
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

function makeUrl(path: string): string {
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL");
  }
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

export async function supabaseRestGet<T>(path: string): Promise<T> {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase env is not configured");
  }

  const res = await fetch(makeUrl(path), {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}
