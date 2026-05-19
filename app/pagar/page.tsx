import { Suspense } from "react";
import PagarContent from "./PagarContent";

export default function PagarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-theme">
          <p className="font-outfit text-theme-muted">Cargando pago…</p>
        </div>
      }
    >
      <PagarContent />
    </Suspense>
  );
}
