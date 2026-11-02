"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsView } from "@/features/notifications/components/notifications-view";
import { SendNotificationForm } from "@/features/notifications/components/send-notification-form";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Read your notifications or send one to your users."
      />
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <NotificationsView />
        </TabsContent>
        <TabsContent value="send" className="mt-4">
          <SendNotificationForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
