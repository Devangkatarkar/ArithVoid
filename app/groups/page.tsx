import ProtectedPage from "@/components/auth/protected-page";
import GroupsClient from "@/components/storage/groups-client";

export default function GroupsPage() {
  return (
    <ProtectedPage>
      <GroupsClient />
    </ProtectedPage>
  );
}