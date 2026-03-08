import Image from "next/image";
import Link from "next/link";
import FileShareOrbit from "@/components/landing/FileShareOrbit";

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] bg-white/38 shadow-[0_20px_70px_rgba(10,35,66,0.10)] backdrop-blur-2xl ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/18 to-[#dff3ff]/18" />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen text-[#0A2342]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-8 md:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <GlassCard className="p-6 md:p-8">
            <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#7CC7F2]/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#0A2342]/10 blur-3xl" />

            <div className="mb-6 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Arithvoid"
                width={200}
                height={200}
                priority
              />
              <div>
                <p className="text-sm text-[#56758F]">
                  Secure company ZIP storage
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-full bg-white/55 px-3 py-1 text-sm text-[#24547B] backdrop-blur">
              Personal vaults • Group storage • 7-day cleanup
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight md:text-4xl">
              One secure place for your company ZIP files.
            </h1>

            <p className="mt-5 max-w-2xl text-base text-[#4E6A82]">
              Upload, share, download, and manage personal or team files with a
              simple private workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-2xl bg-[#0A2342] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#123A63]"
              >
                Open Arithvoid
              </Link>

              <Link
                href="/login"
                className="rounded-2xl bg-white/60 px-5 py-3 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
              >
                Sign in
              </Link>
            </div>
          </GlassCard>

          <div className="relative">
            <FileShareOrbit />
          </div>
        </div>

        <GlassCard className="mt-8 p-6 md:p-7">
          <div className="absolute -top-10 right-10 h-40 w-40 rounded-full bg-[#7CC7F2]/20 blur-3xl" />

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/65 text-xl">
              📦
            </div>
            <div>
              <p className="font-medium text-[#0A2342]">Arithvoid Vault</p>
              <p className="text-sm text-[#5D7991]">
                Secure internal storage
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] bg-white/35 p-4 backdrop-blur-xl">
              <p className="text-sm font-medium text-[#0A2342]">
                Personal Vaults
              </p>
              <p className="mt-1 text-sm text-[#58758D]">
                Keep your own ZIP files accessible anywhere after login.
              </p>
            </div>

            <div className="rounded-[26px] bg-white/35 p-4 backdrop-blur-xl">
              <p className="text-sm font-medium text-[#0A2342]">
                Shared Groups
              </p>
              <p className="mt-1 text-sm text-[#58758D]">
                Create team spaces for collaborative file sharing.
              </p>
            </div>

            <div className="rounded-[26px] bg-white/35 p-4 backdrop-blur-xl">
              <p className="text-sm font-medium text-[#0A2342]">
                Version History
              </p>
              <p className="mt-1 text-sm text-[#58758D]">
                Upload newer versions without losing older ones.
              </p>
            </div>

            <div className="rounded-[26px] bg-white/35 p-4 backdrop-blur-xl">
              <p className="text-sm font-medium text-[#0A2342]">
                Auto Cleanup
              </p>
              <p className="mt-1 text-sm text-[#58758D]">
                Files are removed automatically after 7 days.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}