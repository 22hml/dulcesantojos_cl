import { cookies } from "next/headers";

export function isAdminSession() {
  return cookies().get("admin_session")?.value === "1";
}
