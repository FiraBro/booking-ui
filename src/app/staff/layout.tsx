import type { ReactNode } from "react";
import { ProtectedLayout } from "@/components/layout/protected-layout";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout allowedRoles={["staff"]}>{children}</ProtectedLayout>;
}
