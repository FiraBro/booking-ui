"use client";

import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/config/routes";
import { personName } from "@/features/bookings/lib/display";
import { HolidayForm } from "@/features/staff/components/holiday-form";
import { ScheduleCalendar } from "@/features/staff/components/schedule-calendar";
import { ScheduleEditor } from "@/features/staff/components/schedule-editor";
import { StaffForm } from "@/features/staff/components/staff-form";
import { StaffServicesForm } from "@/features/staff/components/staff-services-form";
import { useStaffMember } from "@/features/staff/hooks/use-staff";
import { useDeleteStaff } from "@/features/staff/hooks/use-staff-mutations";

export default function AdminStaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>();
  const router = useRouter();
  const query = useStaffMember(staffId);
  const remove = useDeleteStaff();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const back = { href: ROUTES.admin.staff, label: "All staff" };

  if (query.isPending) return <PageSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff member" back={back} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const member = query.data;
  const name = personName(member);

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={member.title ?? member.email ?? undefined}
        back={back}
        actions={
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden />
            Delete
          </Button>
        }
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="schedule">Working hours</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <StaffForm key={member.updatedAt ?? member.id} member={member} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Choose which services {member.firstName || "this person"} can
                perform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffServicesForm staffId={member.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly working hours</CardTitle>
                <CardDescription>
                  Customers can only book inside these hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleEditor staffId={member.id} />
              </CardContent>
            </Card>
            <Card className="self-start">
              <CardHeader>
                <CardTitle>Time off</CardTitle>
                <CardDescription>
                  Block holidays and absences. These days can&apos;t be booked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HolidayForm staffId={member.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <ScheduleCalendar staffId={member.id} role="admin" />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${name}?`}
        description="Their future availability is removed. Past bookings keep their history."
        confirmLabel="Delete staff member"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(member.id, {
            onSuccess: () => router.replace(ROUTES.admin.staff),
            onSettled: () => setConfirmOpen(false),
          })
        }
      />
    </div>
  );
}
