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

function SoftChip({
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
          : "inline-flex rounded-full bg-white/55 px-3 py-1.5 text-xs font-medium text-[#24547B] backdrop-blur"
      }
    >
      {children}
    </span>
  );
}

export default function PersonalStorageClient() {
  const supabase = createClient();

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [userId, setUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileRow[]>([]);
  const [versionsByFile, setVersionsByFile] = useState<Record<string, FileVersionRow[]>>({});
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
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

  async function loadFiles(currentUserId?: string) {
    setLoading(true);

    let uid = currentUserId ?? userId;

    if (!uid) {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        showToast(authErr?.message ?? "Not logged in.", "error");
        setLoading(false);
        return;
      }

      uid = user.id;
      setUserId(user.id);
    }

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("storage_type", "personal")
      .eq("owner_user_id", uid)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(error.message, "error");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as FileRow[];
    setFiles(rows);
    setFilteredFiles(rows);

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);

      const { data: versions, error: versionsError } = await supabase
        .from("file_versions")
        .select("*")
        .in("file_id", ids)
        .order("version_number", { ascending: false });

      if (versionsError) {
        showToast(versionsError.message, "error");
        setLoading(false);
        return;
      }

      const grouped: Record<string, FileVersionRow[]> = {};
      for (const v of (versions ?? []) as FileVersionRow[]) {
        if (!grouped[v.file_id]) grouped[v.file_id] = [];
        grouped[v.file_id].push(v);
      }
      setVersionsByFile(grouped);
    } else {
      setVersionsByFile({});
    }

    setLoading(false);
  }

  useEffect(() => {
    (async () => {
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
      await loadFiles(user.id);
    })();
  }, []);

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
    const path = `personal/${userId}/${fileId}/v${versionNumber}-${safeFileName}`;

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
      storage_type: "personal",
      owner_user_id: userId,
      owner_group_id: null,
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
    showToast("ZIP uploaded successfully.", "success");
    await loadFiles(userId);
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
    const path = `personal/${userId}/${fileRow.id}/v${nextVersion}-${safeFileName}`;

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
    await loadFiles(userId);
    setExpandedFileId(fileRow.id);
  }

  function handleDelete(row: FileRow) {
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
    showToast("File deleted successfully.", "success");
    await loadFiles(userId ?? undefined);
  }

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size_bytes, 0),
    [files]
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
                Arithvoid / Personal Storage
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2342]">
                Personal ZIP Vault
              </h1>
              <p className="mt-2 text-sm text-[#5B778F] md:text-base">
                Upload, replace, download, and track version history for your ZIP files.
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
            <p className="text-sm text-[#5D7991]">Total Files</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">{files.length}</p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm text-[#5D7991]">Storage Used</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {formatBytes(totalSize)}
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm text-[#5D7991]">Visible Files</p>
            <p className="mt-2 text-3xl font-semibold text-[#0A2342]">
              {filteredFiles.length}
            </p>
          </GlassCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-[#0A2342]">Upload ZIP</h2>
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
                className={`cursor-pointer rounded-2xl p-6 text-center ring-1 ring-white/40 backdrop-blur transition ${
                  dragging
                    ? "bg-white/50"
                    : "bg-white/28 hover:bg-white/38"
                }`}
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
                />

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/65 shadow-sm">
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
                className="w-full rounded-2xl bg-white/60 px-4 py-3 text-[#0A2342] outline-none ring-1 ring-white/40 backdrop-blur transition placeholder:text-[#7d96ab] focus:ring-[#7CC7F2]"
              />

              {uploading ? (
                <div className="space-y-2">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/45">
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
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0A2342]">Your Files</h2>
                <p className="mt-1 text-sm text-[#5B778F]">
                  Replace files to create new versions and keep history.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search by title or filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-white/60 px-4 py-3 text-[#0A2342] outline-none ring-1 ring-white/40 backdrop-blur transition placeholder:text-[#7d96ab] focus:ring-[#7CC7F2] md:max-w-xs"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full bg-white/45" />
                <Skeleton className="h-28 w-full bg-white/45" />
                <Skeleton className="h-28 w-full bg-white/45" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No files found"
                description="Upload your first ZIP file to start using version history."
              />
            ) : (
              <div className="grid gap-4">
                {filteredFiles.map((row) => {
                  const versions = versionsByFile[row.id] ?? [];
                  const isExpanded = expandedFileId === row.id;

                  return (
                    <div
                      key={row.id}
                      className="rounded-[26px] bg-white/35 p-4 backdrop-blur-xl"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/65 text-xl">
                            📦
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-[#0A2342]">
                              {row.title}
                            </h3>

                            <p className="mt-1 truncate text-sm text-[#5B778F]">
                              {row.original_name}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <SoftChip>{formatBytes(row.size_bytes)}</SoftChip>
                              <SoftChip>{formatDate(row.created_at)}</SoftChip>
                              <SoftChip>{getExpiryLabel(row.expires_at)}</SoftChip>
                              <SoftChip dark>v{row.current_version}</SoftChip>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => createDownload(row.storage_path)}
                            className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
                          >
                            Download Latest
                          </button>

                          <button
                            onClick={() =>
                              setExpandedFileId(isExpanded ? null : row.id)
                            }
                            className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
                          >
                            {isExpanded ? "Hide History" : "Version History"}
                          </button>

                          <button
                            onClick={() => replaceInputRefs.current[row.id]?.click()}
                            className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
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

                          <button
                            onClick={() => handleDelete(row)}
                            className="rounded-xl bg-white/60 px-4 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
                          >
                            Delete
                          </button>
                        </div>

                        {isExpanded ? (
                          <div className="rounded-[24px] bg-white/45 p-4 backdrop-blur-xl">
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
                                    className="flex flex-col gap-3 rounded-[22px] bg-white/35 p-3 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
                                  >
                                    <div>
                                      <p className="font-medium text-[#0A2342]">
                                        Version {v.version_number}
                                      </p>
                                      <p className="text-sm text-[#5B778F]">
                                        {v.original_name}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <SoftChip>{formatBytes(v.size_bytes)}</SoftChip>
                                        <SoftChip>{formatDate(v.created_at)}</SoftChip>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => createDownload(v.storage_path)}
                                      className="rounded-xl bg-white/60 px-3 py-2 text-sm font-medium text-[#0A2342] ring-1 ring-white/40 backdrop-blur transition hover:bg-white/75"
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
          </GlassCard>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete file?"
        description="This will remove the file and all its version history from storage."
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