import ProtectedPage from "@/components/auth/protected-page";
import GroupDetailClient from "@/components/storage/group-detail-client";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedPage>
      <GroupDetailClient groupId={id} />
    </ProtectedPage>
  );
}