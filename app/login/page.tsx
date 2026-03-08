import Image from "next/image";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff3ff_0%,#eef6fb_35%,#edf5fb_65%,#e7f1f9_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[32px] bg-white/40 p-6 shadow-[0_20px_70px_rgba(10,35,66,0.10)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/20 to-[#cdeeff]/20" />
          <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#7CC7F2]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#0A2342]/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Arithvoid"
                  width={200}
                  height={200
                  }
                  priority
                />
                <div>
                  <p className="text-sm text-[#5A7992]">
                    Secure company ZIP storage
                  </p>
                </div>
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-[#0A2342] md:text-5xl">
                Welcome back
              </h1>

              <p className="mt-4 max-w-2xl text-sm text-[#5B778F] md:text-base">
                Access your files, group vaults, and version history from one secure workspace.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/55 px-3 py-1 text-[#24547B] backdrop-blur">
                  Personal vaults
                </span>
                <span className="rounded-full bg-white/55 px-3 py-1 text-[#24547B] backdrop-blur">
                  Shared groups
                </span>
                <span className="rounded-full bg-white/55 px-3 py-1 text-[#24547B] backdrop-blur">
                  7-day cleanup
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white/35 p-4 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/65 text-xl">
                  📦
                </div>
                <h2 className="mt-4 text-base font-semibold text-[#0A2342]">
                  Personal Storage
                </h2>
                <p className="mt-2 text-sm text-[#5B778F]">
                  Keep your own ZIP files available across devices.
                </p>
              </div>

              <div className="rounded-3xl bg-white/35 p-4 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/65 text-xl">
                  👥
                </div>
                <h2 className="mt-4 text-base font-semibold text-[#0A2342]">
                  Group Access
                </h2>
                <p className="mt-2 text-sm text-[#5B778F]">
                  Collaborate in shared vaults with your team members.
                </p>
              </div>

              <div className="rounded-3xl bg-white/35 p-4 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/65 text-xl">
                  ⏳
                </div>
                <h2 className="mt-4 text-base font-semibold text-[#0A2342]">
                  Temporary Storage
                </h2>
                <p className="mt-2 text-sm text-[#5B778F]">
                  Files expire automatically to keep storage clean.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden rounded-[32px] bg-white/40 p-6 shadow-[0_20px_70px_rgba(10,35,66,0.10)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-[#dff3ff]/20" />
          <div className="absolute -top-10 right-10 h-40 w-40 rounded-full bg-[#7CC7F2]/20 blur-3xl" />

          <div className="relative w-full max-w-md">
            <div className="mb-6">
              <p className="text-sm font-medium text-[#56758F]">
                Sign in to continue
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2342]">
                Open your workspace
              </h2>
              <p className="mt-2 text-sm text-[#5B778F]">
                Enter your company account details to access Arithvoid.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}