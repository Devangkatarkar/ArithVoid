"use client";

import ProtectedPage from "@/components/auth/protected-page";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FileRow = {
  id: string;
  size_bytes: number;
  storage_type: "personal" | "group";
  is_deleted: boolean;
};

type GroupMembershipRow = {
  group_id: string;
  member_role: "owner" | "member";
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[30px] bg-white/38 shadow-[0_20px_70px_rgba(10,35,66,0.10)] backdrop-blur-2xl ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/18 to-[#dff3ff]/18" />
      <div className="relative">{children}</div>
    </div>
  );
}

function DashboardContent() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [memberships, setMemberships] = useState<GroupMembershipRow[]>([]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    (async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? "");

      const { data: myFiles } = await supabase
        .from("files")
        .select("id, size_bytes, storage_type, is_deleted")
        .eq("uploaded_by", user.id)
        .eq("is_deleted", false);

      const { data: myMemberships } = await supabase
        .from("group_members")
        .select("group_id, member_role")
        .eq("user_id", user.id);

      setFiles((myFiles ?? []) as FileRow[]);
      setMemberships((myMemberships ?? []) as GroupMembershipRow[]);
      setLoading(false);
    })();
  }, [supabase]);

  const totalUploads = useMemo(() => files.length, [files]);
  const totalPersonal = useMemo(
    () => files.filter((f) => f.storage_type === "personal").length,
    [files]
  );
  const totalGroupUploads = useMemo(
    () => files.filter((f) => f.storage_type === "group").length,
    [files]
  );
  const totalStorage = useMemo(
    () => files.reduce((sum, f) => sum + f.size_bytes, 0),
    [files]
  );
  const totalGroups = useMemo(() => memberships.length, [memberships]);
  const ownedGroups = useMemo(
    () => memberships.filter((m) => m.member_role === "owner").length,
    [memberships]
  );

  return (
    <main className="min-h-screen ">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <GlassCard className="mb-8 p-6">
          <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-[#7CC7F2]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[#0A2342]/10 blur-3xl" />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-[#56758F]">Arithvoid</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2342] md:text-4xl">
                Secure company ZIP storage
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#5B778F] md:text-base">
                Manage personal uploads, shared group vaults, version history,
                and 7-day auto-cleanup from one place.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/55 px-3 py-1 text-[#24547B] backdrop-blur">
                  Signed in as: {email || "Loading..."}
                </span>
                <span className="rounded-full bg-white/55 px-3 py-1 text-[#24547B] backdrop-blur">
                  7-day auto delete
                </span>
                <span className="rounded-full bg-white/55 px-3 py-1 text-[#24547B] backdrop-blur">
                  Personal + Group Vaults
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/personal"
                className="rounded-xl bg-[#0A2342] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#123A63]"
              >
                Open Personal
              </Link>

              <Link
                href="/groups"
                className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
              >
                Open Groups
              </Link>

            </div>
          </div>
        </GlassCard>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["My Total Uploads", loading ? "..." : totalUploads],
            ["Personal Files", loading ? "..." : totalPersonal],
            ["Group Uploads", loading ? "..." : totalGroupUploads],
            ["My Groups", loading ? "..." : totalGroups],
            ["Storage Used", loading ? "..." : formatBytes(totalStorage)],
          ].map(([label, value]) => (
            <GlassCard key={label} className="p-5">
              <p className="text-sm text-[#5D7991]">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#0A2342]">{value}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-[#0A2342]">Workspaces</h2>
            <p className="mt-1 text-sm text-[#5B778F]">
              Jump into your personal vault or shared group spaces.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Link
                href="/personal"
                className="rounded-[26px] bg-white/35 p-5 backdrop-blur-xl transition hover:bg-white/45"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/65 text-xl">
                  📦
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0A2342]">
                  Personal Storage
                </h3>
                <p className="mt-2 text-sm text-[#5B778F]">
                  Upload your own ZIP files, download them anywhere, and manage
                  version history easily.
                </p>
              </Link>

              <Link
                href="/groups"
                className="rounded-[26px] bg-white/35 p-5 backdrop-blur-xl transition hover:bg-white/45"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/65 text-xl">
                  👥
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0A2342]">
                  Group Storage
                </h3>
                <p className="mt-2 text-sm text-[#5B778F]">
                  Create team vaults, add members, and collaborate on shared ZIP
                  files securely.
                </p>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-[#0A2342]">
              Quick overview
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl">
                <p className="font-medium text-[#0A2342]">Owned groups</p>
                <p className="mt-1 text-sm text-[#5B778F]">
                  {loading ? "..." : ownedGroups} groups managed by you.
                </p>
              </div>

              <div className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl">
                <p className="font-medium text-[#0A2342]">Version history</p>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Files can be replaced without losing older versions.
                </p>
              </div>

              <div className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl">
                <p className="font-medium text-[#0A2342]">Temporary storage</p>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Old files are automatically removed after 7 days.
                </p>
              </div>

              <div className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl">
                <p className="font-medium text-[#0A2342]">Team collaboration</p>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Group owners can add members and manage shared access.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold text-[#0A2342]">Quick actions</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Link
              href="/personal"
              className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl transition hover:bg-white/45"
            >
              <p className="font-medium text-[#0A2342]">Upload personal ZIP</p>
              <p className="mt-1 text-sm text-[#5B778F]">
                Open your personal vault and upload a new file.
              </p>
            </Link>

            <Link
              href="/groups"
              className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl transition hover:bg-white/45"
            >
              <p className="font-medium text-[#0A2342]">Create a new group</p>
              <p className="mt-1 text-sm text-[#5B778F]">
                Start a new team vault for shared files and members.
              </p>
            </Link>

            <Link
              href="/groups"
              className="rounded-[24px] bg-white/35 p-4 backdrop-blur-xl transition hover:bg-white/45"
            >
              <p className="font-medium text-[#0A2342]">Manage members</p>
              <p className="mt-1 text-sm text-[#5B778F]">
                Open a group to add or remove people.
              </p>
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <DashboardContent />
    </ProtectedPage>
  );
}