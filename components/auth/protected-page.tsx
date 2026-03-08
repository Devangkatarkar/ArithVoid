"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    })();
  }, [router, supabase]);

  if (checking) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff3ff_0%,#eef6fb_35%,#edf5fb_65%,#e7f1f9_100%)] flex items-center justify-center">
        <div className="relative w-full max-w-md rounded-[32px] bg-white/40 p-8 shadow-[0_20px_70px_rgba(10,35,66,0.10)] backdrop-blur-2xl">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-[#7CC7F2]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#0A2342]/10 blur-3xl" />

          <div className="relative text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6FD] text-2xl shadow-sm">
              🔐
            </div>

            <h2 className="mt-5 text-xl font-semibold text-[#0A2342]">
              Checking access
            </h2>

            <p className="mt-2 text-sm text-[#5B778F]">
              Verifying your authentication session...
            </p>

            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#DCEEF9]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#0A2342]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}