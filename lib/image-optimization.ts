export function isSupabaseStorageUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
