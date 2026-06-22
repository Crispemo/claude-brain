import { cookies } from "next/headers";

const SESSION_COOKIE = "dashboard_session";
const SESSION_VALUE = "authenticated";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export function checkPassword(password: string): boolean {
  return password === process.env.DASHBOARD_PASSWORD;
}

export { SESSION_COOKIE, SESSION_VALUE };
