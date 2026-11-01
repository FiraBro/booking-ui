import type { ReactNode } from "react";
import { ProtectedLayout } from "@/components/layout/protected-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout allowedRoles={["admin"]}>{children}</ProtectedLayout>;
}
