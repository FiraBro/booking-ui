import { PageHeader } from "@/components/shared/page-header";
import { InviteStaffForm } from "@/features/users/components/invite-staff-form";

export default function InviteStaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invite staff" description="Provision a team member with a secure passwordless invitation." />
      <InviteStaffForm />
    </div>
  );
}
