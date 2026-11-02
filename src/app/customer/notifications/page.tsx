import { PageHeader } from "@/components/shared/page-header";
import { NotificationsView } from "@/features/notifications/components/notifications-view";

export default function CustomerNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates about your bookings and payments."
      />
      <NotificationsView />
    </div>
  );
}
