"use server";

import { cookies } from "next/headers";

const ANON_ID_COOKIE = "anon_id";

export async function getAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  const id = cookieStore.get(ANON_ID_COOKIE)?.value;
  if (!id) {
    throw new Error("Anonymous ID cookie is missing. Middleware should have set it.");
  }
  return id;
}
