"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  if (pathname === "/" || pathname === "/login") return null;

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="relative mx-auto max-w-7xl px-4 pt-3 md:px-6">

        {/* SKY BLUE GLASS LAYER */}
        <div className="absolute inset-x-4 inset-y-0 rounded-[26px] bg-[#EAF6FD]/60 backdrop-blur-xl md:inset-x-6" />

        {/* GRADIENT BLEND */}
        <div className="absolute inset-x-4 top-0 h-full rounded-[26px] bg-gradient-to-b from-[#dff3ff]/60 via-[#eef6fb]/30 to-transparent md:inset-x-6" />

        {/* SOFT GLOW */}
        <div className="pointer-events-none absolute left-10 top-0 h-20 w-20 rounded-full bg-[#7CC7F2]/25 blur-2xl" />
        <div className="pointer-events-none absolute right-10 top-0 h-20 w-20 rounded-full bg-[#0A2342]/10 blur-2xl" />

        <div className="relative flex h-16 items-center justify-between rounded-[26px] px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Arithvoid"
              width={150}
              height={100}
              priority
            />
          </Link>

          <button
            onClick={signOut}
            className="rounded-xl bg-[#F4FAFE]/80 px-4 py-2 text-sm font-medium text-[#0A2342] backdrop-blur transition hover:bg-[#e6f4fc]"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}