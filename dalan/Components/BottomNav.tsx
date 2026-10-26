"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Map",
    fullLabel: "Map",
    href: "/",
    icon: (
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15" />
    ),
  },
  {
    label: "Fare",
    fullLabel: "Fare Calculator",
    href: "/fare-calculator",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 3h2m4 0h2" />
      </>
    ),
  },
  {
    label: "Feedback",
    fullLabel: "Feedback",
    href: "/feedback",
    icon: (
      <>
        <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M8 11h8M8 15h5" />
      </>
    ),
  },
  {
    label: "Settings",
    fullLabel: "Settings",
    href: "/settings",
    icon: (
     <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 2.8-.2-.1a1.7 1.7 0 0 0-1.8.1 1.7 1.7 0 0 0-.8 1.5v.2h-3.2v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.1l-.2.1-1.6-2.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.6-2.8.2.1a1.7 1.7 0 0 0 1.8-.1 1.7 1.7 0 0 0 .8-1.5v-.2h3.2v.2a1.7 1.7 0 0 0 1.1 1.5 1.7 1.7 0 0 0 1.8-.1l.2-.1 1.6 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-[2000] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-[0_8px_28px_rgba(0,0,0,0.14)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
    >
      <ul className="mx-auto grid h-16 w-full max-w-3xl grid-cols-4">
        {navigationItems.map(({ label, fullLabel, href, icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-label={fullLabel ?? label}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-full min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] leading-none font-medium transition-colors sm:text-xs ${
                  isActive
                    ? "text-orange-700 dark:text-orange-300"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  {icon}
                </svg>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
