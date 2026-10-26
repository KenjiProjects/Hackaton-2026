"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current) {
      navRef.current.hidden = pathname.startsWith("/tg-admin-x7k2");
    }
  }, [pathname]);

  return (
    <nav ref={navRef} className="border-b p-3" />
  );
}