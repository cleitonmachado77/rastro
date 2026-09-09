"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/labels";

const links = [
  { href: "/casos", label: "Casos" },
  { href: "/buscar", label: "Buscar" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const isMap = pathname?.startsWith("/casos/") && pathname !== "/casos";

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      router.push("/buscar");
      return;
    }
    router.push(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--line)]",
        isMap
          ? "bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="brand-mark text-sm text-[var(--fg)] shrink-0">
          Rastro
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {links.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 text-xs tracking-wide uppercase transition-colors",
                  active
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg-faint)] hover:text-[var(--fg-muted)]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={onSearch} className="ml-auto flex items-center gap-2 min-w-0">
          <div className="relative hidden sm:block w-52 lg:w-72">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-faint)]"
              size={14}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar atores, eventos, casos…"
              className="input pl-8 py-1.5 text-sm"
              aria-label="Buscar"
            />
          </div>
          <Link href="/buscar" className="sm:hidden text-[var(--fg-muted)] p-2" aria-label="Buscar">
            <Search size={16} />
          </Link>
        </form>
      </div>
    </header>
  );
}
