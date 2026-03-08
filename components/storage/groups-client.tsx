"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Toast from "@/components/ui/toast";
import EmptyState from "@/components/ui/empty-state";
import Skeleton from "@/components/ui/skeleton";

type GroupRow = {
  group_id: string;
  member_role: "owner" | "member";
  groups: {
    id: string;
    name: string;
    slug: string;
    created_at?: string;
  } | null;
};

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
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

function SoftChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-white/55 px-3 py-1.5 text-xs font-medium text-[#24547B] backdrop-blur">
      {children}
    </span>
  );
}

export default function GroupsClient() {
  const supabase = createClient();

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  function showToast(
    message: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  }

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      setFilteredGroups(groups);
      return;
    }

    setFilteredGroups(
      groups.filter((row) => {
        const name = row.groups?.name?.toLowerCase() ?? "";
        const slug = row.groups?.slug?.toLowerCase() ?? "";
        const role = row.member_role?.toLowerCase() ?? "";
        return name.includes(q) || slug.includes(q) || role.includes(q);
      })
    );
  }, [search, groups]);

  async function loadGroups() {
    setLoading(true);

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      showToast(authErr?.message ?? "Not logged in.", "error");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("group_members")
      .select("group_id, member_role, groups(id, name, slug, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(error.message, "error");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as GroupRow[];
    setGroups(rows);
    setFilteredGroups(rows);
    setLoading(false);
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleCreateGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = groupName.trim();
    if (!name) {
      showToast("Group name is required.", "error");
      return;
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      showToast(authErr?.message ?? "Not logged in.", "error");
      return;
    }

    setCreating(true);

    const groupId = crypto.randomUUID();
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

    const { error: groupErr } = await supabase.from("groups").insert({
      id: groupId,
      name,
      slug,
      created_by: user.id,
    });

    if (groupErr) {
      setCreating(false);
      showToast(groupErr.message, "error");
      return;
    }

    const { error: memberErr } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      member_role: "owner",
    });

    if (memberErr) {
      setCreating(false);
      showToast(memberErr.message, "error");
      return;
    }

    setGroupName("");
    setCreating(false);
    showToast("Group created successfully.", "success");
    await loadGroups();
  }

  const ownerCount = useMemo(
    () => groups.filter((g) => g.member_role === "owner").length,
    [groups]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff3ff_0%,#eef6fb_35%,#edf5fb_65%,#e7f1f9_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <GlassCard className="mb-8 p-6">
          <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-[#7CC7F2]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[#0A2342]/10 blur-3xl" />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#56758F]">
                Arithvoid / Groups
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2342]">
                Shared Group Vaults
              </h1>
              <p className="mt-2 text-sm text-[#5B778F] md:text-base">
                Create team spaces, manage shared ZIP storage, and collaborate
                with your members.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </GlassCard>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5">
            <p className="text-sm text-[#5D7991]">Total Groups</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {groups.length}
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm text-[#5D7991]">Owned by You</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {ownerCount}
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm text-[#5D7991]">Visible Groups</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {filteredGroups.length}
            </p>
          </GlassCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-[#0A2342]">
              Create New Group
            </h2>
            <p className="mt-1 text-sm text-[#5B778F]">
              Start a shared vault for a team, department, or project.
            </p>

            <form onSubmit={handleCreateGroup} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#355A78]">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-2xl bg-white/60 px-4 py-3 text-[#0A2342] outline-none ring-1 ring-white/40 backdrop-blur transition placeholder:text-[#7d96ab] focus:ring-[#7CC7F2]"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-2xl bg-[#0A2342] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#123A63] disabled:opacity-60"
              >
                {creating ? "Creating Group..." : "Create Group"}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0A2342]">
                  Your Groups
                </h2>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Open a group to manage shared files and members.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-white/60 px-4 py-3 text-[#0A2342] outline-none ring-1 ring-white/40 backdrop-blur transition placeholder:text-[#7d96ab] focus:ring-[#7CC7F2] md:max-w-xs"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full bg-white/45" />
                <Skeleton className="h-24 w-full bg-white/45" />
                <Skeleton className="h-24 w-full bg-white/45" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No groups found"
                description="Create your first group to start shared storage."
              />
            ) : (
              <div className="grid gap-4">
                {filteredGroups.map((row) => (
                  <Link
                    key={row.group_id}
                    href={`/groups/${row.group_id}`}
                    className="rounded-[26px] bg-white/35 p-4 backdrop-blur-xl transition hover:bg-white/45"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/65 text-xl">
                            👥
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-[#0A2342]">
                              {row.groups?.name || "Untitled Group"}
                            </h3>
                            <p className="truncate text-sm text-[#5B778F]">
                              {row.groups?.slug || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <SoftChip>Role: {row.member_role}</SoftChip>
                          <SoftChip>
                            Created: {formatDate(row.groups?.created_at)}
                          </SoftChip>
                        </div>
                      </div>

                      <div className="flex">
                        <span className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75">
                          Open Group
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <Toast
        open={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </main>
  );
}