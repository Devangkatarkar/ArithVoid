"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Toast from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/confirm-modal";
import EmptyState from "@/components/ui/empty-state";
import Skeleton from "@/components/ui/skeleton";

type FileRow = {
  id: string;
  title: string;
  original_name: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
  expires_at: string;
  uploaded_by: string;
  storage_type: "personal" | "group";
  owner_user_id: string | null;
  owner_group_id: string | null;
  is_deleted: boolean;
  current_version: number;
};

type FileVersionRow = {
  id: string;
  file_id: string;
  version_number: number;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
};

type ProfileObject = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

type GroupObject = {
  id: string;
  name: string;
  slug: string;
};

type MembershipRow = {
  id: string;
  user_id: string;
  member_role: "owner" | "member";
  profiles: ProfileObject | null;
};

type MembershipQueryRow = {
  id: string;
  user_id: string;
  member_role: "owner" | "member";
  profiles: ProfileObject | ProfileObject[] | null;
};

type GroupMetaRow = {
  member_role: "owner" | "member";
  groups: GroupObject | GroupObject[] | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getExpiryLabel(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days >= 1) return `Expires in ${days} day${days > 1 ? "s" : ""}`;
  return `Expires in ${hours} hour${hours !== 1 ? "s" : ""}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function InfoChip({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={
        dark
          ? "inline-flex rounded-full bg-[#0A2342] px-3 py-1.5 text-xs font-medium text-white"
          : "inline-flex rounded-full bg-[#EAF6FD] px-3 py-1.5 text-xs font-medium text-[#24547B]"
      }
    >
      {children}
    </span>
  );
}

export default function GroupDetailClient({ groupId }: { groupId: string }) {
  const supabase = createClient();

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [memberRole, setMemberRole] = useState<"owner" | "member" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [files, setFiles] = useState<FileRow[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileRow[]>([]);
  const [versionsByFile, setVersionsByFile] = useState<Record<string, FileVersionRow[]>>({});
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  const [members, setMembers] = useState<MembershipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [search, setSearch] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FileRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  function showToast(
    message: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  }

  async function loadPage() {
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

    setUserId(user.id);

    const { data: membership, error: membershipErr } = await supabase
      .from("group_members")
      .select("member_role, groups(id, name, slug)")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipErr || !membership) {
      showToast(
        membershipErr?.message ?? "You do not have access to this group.",
        "error"
      );
      setLoading(false);
      return;
    }

    const membershipRow = membership as GroupMetaRow;
    const group = Array.isArray(membershipRow.groups)
      ? (membershipRow.groups[0] ?? null)
      : membershipRow.groups ?? null;

    setMemberRole(membershipRow.member_role);
    setGroupName(group?.name ?? "Group");
    setGroupSlug(group?.slug ?? "");

    const { data: fileData, error: filesErr } = await supabase
      .from("files")
      .select("*")
      .eq("storage_type", "group")
      .eq("owner_group_id", groupId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (filesErr) {
      showToast(filesErr.message, "error");
      setLoading(false);
      return;
    }

    const loadedFiles = (fileData ?? []) as FileRow[];
    setFiles(loadedFiles);
    setFilteredFiles(loadedFiles);

    if (loadedFiles.length > 0) {
      const ids = loadedFiles.map((r) => r.id);

      const { data: versionData, error: versionsErr } = await supabase
        .from("file_versions")
        .select("*")
        .in("file_id", ids)
        .order("version_number", { ascending: false });

      if (versionsErr) {
        showToast(versionsErr.message, "error");
        setLoading(false);
        return;
      }

      const grouped: Record<string, FileVersionRow[]> = {};
      for (const v of (versionData ?? []) as FileVersionRow[]) {
        if (!grouped[v.file_id]) grouped[v.file_id] = [];
        grouped[v.file_id].push(v);
      }
      setVersionsByFile(grouped);
    } else {
      setVersionsByFile({});
    }

    const { data: memberData, error: memberListErr } = await supabase
      .from("group_members")
      .select("id, user_id, member_role, profiles(id, email, full_name, role)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (memberListErr) {
      showToast(memberListErr.message, "error");
      setLoading(false);
      return;
    }

    const normalizedMembers: MembershipRow[] = (
      (memberData ?? []) as MembershipQueryRow[]
    ).map((member) => ({
      id: member.id,
      user_id: member.user_id,
      member_role: member.member_role,
      profiles: Array.isArray(member.profiles)
        ? (member.profiles[0] ?? null)
        : member.profiles ?? null,
    }));

    setMembers(normalizedMembers);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, [groupId]);

  useEffect(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      setFilteredFiles(files);
      return;
    }

    setFilteredFiles(
      files.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.original_name.toLowerCase().includes(q)
      )
    );
  }, [search, files]);

  function onChooseFile(selected: File | null) {
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".zip")) {
      showToast("Only ZIP files are allowed.", "error");
      return;
    }

    setFile(selected);

    if (!title.trim()) {
      setTitle(selected.name.replace(/\.zip$/i, ""));
    }
  }

  async function createDownload(path: string) {
    const { data, error } = await supabase.storage
      .from("arithvoid-files")
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      showToast(error?.message ?? "Failed to create download link.", "error");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      showToast("User not found.", "error");
      return;
    }

    if (!file) {
      showToast("Please choose a ZIP file.", "error");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      showToast("Only ZIP files are allowed.", "error");
      return;
    }

    setUploading(true);
    setUploadProgress(15);

    const fileId = crypto.randomUUID();
    const versionNumber = 1;
    const safeFileName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `groups/${groupId}/${fileId}/v${versionNumber}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("arithvoid-files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploading(false);
      setUploadProgress(0);
      showToast(uploadError.message, "error");
      return;
    }

    setUploadProgress(65);

    const { error: insertFileError } = await supabase.from("files").insert({
      id: fileId,
      title: title.trim() || file.name.replace(/\.zip$/i, ""),
      original_name: file.name,
      storage_path: path,
      mime_type: file.type || "application/zip",
      size_bytes: file.size,
      uploaded_by: userId,
      storage_type: "group",
      owner_user_id: null,
      owner_group_id: groupId,
      current_version: 1,
    });

    if (insertFileError) {
      await supabase.storage.from("arithvoid-files").remove([path]);
      setUploading(false);
      setUploadProgress(0);
      showToast(insertFileError.message, "error");
      return;
    }

    const { error: versionError } = await supabase.from("file_versions").insert({
      file_id: fileId,
      version_number: 1,
      storage_path: path,
      original_name: file.name,
      mime_type: file.type || "application/zip",
      size_bytes: file.size,
      uploaded_by: userId,
    });

    if (versionError) {
      setUploading(false);
      setUploadProgress(0);
      showToast(versionError.message, "error");
      return;
    }

    setTitle("");
    setFile(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    setUploadProgress(100);
    setUploading(false);
    showToast("Group ZIP uploaded successfully.", "success");
    await loadPage();
    setUploadProgress(0);
  }

  async function handleReplace(fileRow: FileRow, replacement: File | null) {
    if (!userId) {
      showToast("User not found.", "error");
      return;
    }

    if (!replacement) {
      showToast("Please choose a ZIP file.", "error");
      return;
    }

    if (!replacement.name.toLowerCase().endsWith(".zip")) {
      showToast("Only ZIP files are allowed.", "error");
      return;
    }

    const nextVersion = (fileRow.current_version ?? 1) + 1;
    const safeFileName = replacement.name.replace(/[^\w.\-]/g, "_");
    const path = `groups/${groupId}/${fileRow.id}/v${nextVersion}-${safeFileName}`;

    setReplacingFileId(fileRow.id);

    const { error: uploadError } = await supabase.storage
      .from("arithvoid-files")
      .upload(path, replacement, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setReplacingFileId(null);
      showToast(uploadError.message, "error");
      return;
    }

    const { error: versionError } = await supabase.from("file_versions").insert({
      file_id: fileRow.id,
      version_number: nextVersion,
      storage_path: path,
      original_name: replacement.name,
      mime_type: replacement.type || "application/zip",
      size_bytes: replacement.size,
      uploaded_by: userId,
    });

    if (versionError) {
      setReplacingFileId(null);
      showToast(versionError.message, "error");
      return;
    }

    const { error: updateError } = await supabase
      .from("files")
      .update({
        storage_path: path,
        original_name: replacement.name,
        mime_type: replacement.type || "application/zip",
        size_bytes: replacement.size,
        current_version: nextVersion,
      })
      .eq("id", fileRow.id);

    if (updateError) {
      setReplacingFileId(null);
      showToast(updateError.message, "error");
      return;
    }

    if (replaceInputRefs.current[fileRow.id]) {
      replaceInputRefs.current[fileRow.id]!.value = "";
    }

    setReplacingFileId(null);
    showToast(`Version ${nextVersion} uploaded.`, "success");
    await loadPage();
    setExpandedFileId(fileRow.id);
  }

  function handleDelete(row: FileRow) {
    if (memberRole !== "owner") {
      showToast("Only group owners can delete group files.", "error");
      return;
    }

    setPendingDelete(row);
    setConfirmOpen(true);
  }

  async function confirmDeleteFile() {
    if (!pendingDelete) return;

    setConfirmLoading(true);

    const versions = versionsByFile[pendingDelete.id] ?? [];
    const allPaths = Array.from(
      new Set([
        pendingDelete.storage_path,
        ...versions.map((v) => v.storage_path),
      ])
    );

    const { error: storageError } = await supabase.storage
      .from("arithvoid-files")
      .remove(allPaths);

    if (storageError) {
      setConfirmLoading(false);
      setConfirmOpen(false);
      showToast(storageError.message, "error");
      return;
    }

    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", pendingDelete.id);

    if (dbError) {
      setConfirmLoading(false);
      setConfirmOpen(false);
      showToast(dbError.message, "error");
      return;
    }

    setConfirmLoading(false);
    setConfirmOpen(false);
    setPendingDelete(null);
    showToast("Group file deleted successfully.", "success");
    await loadPage();
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (memberRole !== "owner") {
      showToast("Only group owners can add members.", "error");
      return;
    }

    const email = memberEmail.trim().toLowerCase();
    if (!email) {
      showToast("Member email is required.", "error");
      return;
    }

    setAddingMember(true);

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", email)
      .single();

    if (profileErr || !profile) {
      setAddingMember(false);
      showToast("No user found with that email.", "error");
      return;
    }

    const alreadyMember = members.some((m) => m.user_id === profile.id);
    if (alreadyMember) {
      setAddingMember(false);
      showToast("This user is already in the group.", "error");
      return;
    }

    const { error: insertErr } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: profile.id,
      member_role: "member",
    });

    if (insertErr) {
      setAddingMember(false);
      showToast(insertErr.message, "error");
      return;
    }

    setMemberEmail("");
    setAddingMember(false);
    showToast("Member added successfully.", "success");
    await loadPage();
  }

  async function handleRemoveMember(member: MembershipRow) {
    if (memberRole !== "owner") {
      showToast("Only group owners can remove members.", "error");
      return;
    }

    if (member.user_id === userId) {
      showToast("Owner cannot remove themselves from the group.", "error");
      return;
    }

    setRemovingMemberId(member.id);

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", member.id);

    setRemovingMemberId(null);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Member removed successfully.", "success");
    await loadPage();
  }

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size_bytes, 0),
    [files]
  );

  return (
    <main className="min-h-screen bg-[#EEF6FB]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 rounded-3xl border border-[#D6EAF7] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#56758F]">
                Arithvoid / Groups / {groupSlug || "group"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2342]">
                {groupName || "Group Vault"}
              </h1>
              <p className="mt-2 text-sm text-[#5B778F] md:text-base">
                Shared ZIP storage with member access and version history.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <InfoChip>Role: {memberRole ?? "-"}</InfoChip>
                <InfoChip>Slug: {groupSlug || "-"}</InfoChip>
              </div>
            </div>

            <Link
              href="/groups"
              className="rounded-xl border border-[#C6E2F2] bg-white px-4 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE]"
            >
              ← Back to Groups
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-[#D6EAF7] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#5D7991]">Total Files</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {files.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#D6EAF7] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#5D7991]">Storage Used</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {formatBytes(totalSize)}
            </p>
          </div>

          <div className="rounded-3xl border border-[#D6EAF7] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#5D7991]">Members</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {members.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[360px_360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-[#D6EAF7] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0A2342]">Upload to Group</h2>
            <p className="mt-1 text-sm text-[#5B778F]">
              New uploads start at version 1.
            </p>

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  onChooseFile(e.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => uploadInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragging
                    ? "border-[#7CC7F2] bg-[#F4FAFE]"
                    : "border-[#C6E2F2] bg-[#F9FCFE] hover:bg-[#F4FAFE]"
                }`}
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
                />

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6FD] shadow-sm">
                  <span className="text-2xl">📦</span>
                </div>

                <p className="mt-4 font-medium text-[#0A2342]">
                  {file ? file.name : "Drop ZIP here or click to browse"}
                </p>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Only .zip files are allowed
                </p>
              </div>

              <input
                type="text"
                placeholder="Enter a custom title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[#C6E2F2] px-4 py-3 text-[#0A2342] outline-none transition focus:border-[#7CC7F2]"
              />

              {uploading ? (
                <div className="space-y-2">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[#DCEEF9]">
                    <div
                      className="h-full rounded-full bg-[#0A2342] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-[#5B778F]">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-2xl bg-[#0A2342] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#123A63] disabled:opacity-60"
              >
                {uploading ? "Uploading ZIP..." : "Upload ZIP"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[#D6EAF7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0A2342]">Members</h2>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Manage access for this group.
                </p>
              </div>

              {memberRole === "owner" ? (
                <InfoChip>Owner Controls</InfoChip>
              ) : null}
            </div>

            {memberRole === "owner" ? (
              <form onSubmit={handleAddMember} className="mt-5 space-y-3">
                <input
                  type="email"
                  placeholder="Enter member email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[#C6E2F2] px-4 py-3 text-[#0A2342] outline-none transition focus:border-[#7CC7F2]"
                />

                <button
                  type="submit"
                  disabled={addingMember}
                  className="w-full rounded-2xl bg-[#0A2342] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#123A63] disabled:opacity-60"
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl bg-[#F9FCFE] px-4 py-3 text-sm text-[#5B778F]">
                Only group owners can add or remove members.
              </div>
            )}

            <div className="mt-5 space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-20 w-full bg-[#DCEEF9]" />
                  <Skeleton className="h-20 w-full bg-[#DCEEF9]" />
                  <Skeleton className="h-20 w-full bg-[#DCEEF9]" />
                </>
              ) : members.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No members found"
                  description="Add members to start collaborating in this group."
                />
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#D9EDF9] bg-[#F9FCFE] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#0A2342]">
                          {member.profiles?.full_name ||
                            member.profiles?.email ||
                            member.user_id}
                        </p>
                        <p className="truncate text-sm text-[#5B778F]">
                          {member.profiles?.email || "No email"}
                        </p>
                        <div className="mt-2">
                          <InfoChip>{member.member_role}</InfoChip>
                        </div>
                      </div>

                      {memberRole === "owner" && member.member_role !== "owner" ? (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={removingMemberId === member.id}
                          className="shrink-0 rounded-xl border border-[#C6E2F2] bg-white px-3 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE] disabled:opacity-60"
                        >
                          {removingMemberId === member.id ? "Removing..." : "Remove"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#D6EAF7] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0A2342]">Group Files</h2>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Search, replace, download, and track file history.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[#C6E2F2] px-4 py-3 text-[#0A2342] outline-none transition focus:border-[#7CC7F2] lg:max-w-xs"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full bg-[#DCEEF9]" />
                <Skeleton className="h-32 w-full bg-[#DCEEF9]" />
                <Skeleton className="h-32 w-full bg-[#DCEEF9]" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No group files yet"
                description="Upload the first ZIP file to start collaborating in this group."
              />
            ) : (
              <div className="grid gap-4">
                {filteredFiles.map((row) => {
                  const versions = versionsByFile[row.id] ?? [];
                  const isExpanded = expandedFileId === row.id;

                  return (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-[#D9EDF9] bg-[#F9FCFE] p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6FD] text-xl">
                            📦
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-[#0A2342]">
                              {row.title || "Untitled file"}
                            </h3>

                            <p className="mt-1 truncate text-sm text-[#5B778F]">
                              {row.original_name}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <InfoChip>{formatBytes(row.size_bytes)}</InfoChip>
                              <InfoChip>{formatDate(row.created_at)}</InfoChip>
                              <InfoChip>{getExpiryLabel(row.expires_at)}</InfoChip>
                              <InfoChip dark>v{row.current_version}</InfoChip>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => createDownload(row.storage_path)}
                            className="rounded-xl border border-[#C6E2F2] bg-white px-4 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE]"
                          >
                            Download Latest
                          </button>

                          <button
                            onClick={() =>
                              setExpandedFileId(isExpanded ? null : row.id)
                            }
                            className="rounded-xl border border-[#C6E2F2] bg-white px-4 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE]"
                          >
                            {isExpanded ? "Hide History" : "Version History"}
                          </button>

                          <button
                            onClick={() => replaceInputRefs.current[row.id]?.click()}
                            className="rounded-xl border border-[#C6E2F2] bg-white px-4 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE]"
                          >
                            {replacingFileId === row.id
                              ? "Replacing..."
                              : "Upload New Version"}
                          </button>

                          <input
                            ref={(el) => {
                              replaceInputRefs.current[row.id] = el;
                            }}
                            type="file"
                            accept=".zip,application/zip"
                            className="hidden"
                            onChange={(e) =>
                              handleReplace(row, e.target.files?.[0] ?? null)
                            }
                          />

                          {memberRole === "owner" ? (
                            <button
                              onClick={() => handleDelete(row)}
                              className="rounded-xl border border-[#C6E2F2] bg-white px-4 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE]"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>

                        {isExpanded ? (
                          <div className="rounded-2xl bg-white p-4">
                            <h4 className="text-sm font-semibold text-[#0A2342]">
                              Version History
                            </h4>

                            {versions.length === 0 ? (
                              <p className="mt-3 text-sm text-[#5B778F]">
                                No versions found.
                              </p>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {versions.map((v) => (
                                  <div
                                    key={v.id}
                                    className="flex flex-col gap-3 rounded-xl border border-[#D9EDF9] bg-[#F9FCFE] p-3 md:flex-row md:items-center md:justify-between"
                                  >
                                    <div>
                                      <p className="font-medium text-[#0A2342]">
                                        Version {v.version_number}
                                      </p>
                                      <p className="text-sm text-[#5B778F]">
                                        {v.original_name}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <InfoChip>{formatBytes(v.size_bytes)}</InfoChip>
                                        <InfoChip>{formatDate(v.created_at)}</InfoChip>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => createDownload(v.storage_path)}
                                      className="rounded-xl border border-[#C6E2F2] bg-white px-3 py-2 text-sm font-medium text-[#0A2342] transition hover:bg-[#F4FAFE]"
                                    >
                                      Download v{v.version_number}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete group file?"
        description="This will remove the file and all its version history from group storage."
        confirmText="Delete"
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
        onConfirm={confirmDeleteFile}
      />

      <Toast
        open={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </main>
  );
}