"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ScheduleCalendar } from "@/features/staff/components/schedule-calendar";
import { StaffGate } from "@/features/staff/components/staff-gate";

export default function StaffSchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Your week at a glance: bookings, working hours and time off."
      />
      <StaffGate>
        {(member) => <ScheduleCalendar staffId={member.id} role="staff" />}
      </StaffGate>
    </div>
  );
}
