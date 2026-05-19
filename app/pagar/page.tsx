import { redirect } from "next/navigation";

type Props = { searchParams: { url?: string } };

/** Compatibilidad: redirige al init_point si llegan con ?url= */
export default function PagarPage({ searchParams }: Props) {
  const url = searchParams.url?.trim();
  if (url && url.startsWith("https://")) {
    redirect(url);
  }
  redirect("/");
}
