"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StaffGate } from "@/features/staff/components/staff-gate";
import { StaffServicesForm } from "@/features/staff/components/staff-services-form";

export default function StaffServicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My services"
        description="Choose the services you offer. Customers can only book you for these."
      />
      <StaffGate>
        {(member) => (
          <Card className="max-w-2xl">
            <CardContent>
              <StaffServicesForm staffId={member.id} />
            </CardContent>
          </Card>
        )}
      </StaffGate>
    </div>
  );
}
