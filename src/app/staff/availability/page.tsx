"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HolidayForm } from "@/features/staff/components/holiday-form";
import { ScheduleEditor } from "@/features/staff/components/schedule-editor";
import { StaffGate } from "@/features/staff/components/staff-gate";

export default function StaffAvailabilityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability"
        description="Set your weekly working hours and block time off."
      />
      <StaffGate>
        {(member) => (
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
                  Add holidays or absences. Those days can&apos;t be booked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HolidayForm staffId={member.id} />
              </CardContent>
            </Card>
          </div>
        )}
      </StaffGate>
    </div>
  );
}
