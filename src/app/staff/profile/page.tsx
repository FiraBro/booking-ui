import { PageHeader } from "@/components/shared/page-header";
import { AccountSettings } from "@/features/auth/components/account-settings";

export default function StaffProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account details and password."
      />
      <AccountSettings />
    </div>
  );
}
