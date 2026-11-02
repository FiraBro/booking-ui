import { PageHeader } from "@/components/shared/page-header";
import { NotificationsView } from "@/features/notifications/components/notifications-view";

export default function StaffNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates about your schedule and bookings."
      />
      <NotificationsView />
    </div>
  );
}
