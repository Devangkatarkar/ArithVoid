import ProtectedPage from "@/components/auth/protected-page";
import PersonalStorageClient from "@/components/storage/personal-storage-client";

export default function PersonalPage() {
  return (
    <ProtectedPage>
      <PersonalStorageClient />
    </ProtectedPage>
  );
}