import Link from "next/link";
import { CATEGORY_PAGES } from "@/lib/seo/categories";

export default function CategoryExploreLinks() {
  return (
    <nav
      aria-label="Categorías del catálogo"
      className="border-t border-border bg-theme-elevated px-[4%] py-10 sm:px-[5%]"
    >
      <p className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gold">
        Explora por categoría
      </p>
      <ul className="flex flex-wrap gap-2">
        {CATEGORY_PAGES.map((cat) => (
          <li key={cat.slug}>
            <Link
              href={`/${cat.slug}`}
              className="inline-block rounded-sm border border-border px-4 py-2 font-outfit text-[0.75rem] uppercase tracking-wider text-gray transition hover:border-gold hover:text-theme"
            >
              {cat.h1.replace(/\s+/g, " ").toLowerCase()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
