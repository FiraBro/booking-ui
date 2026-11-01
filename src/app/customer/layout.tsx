import type { ReactNode } from "react";
import { ProtectedLayout } from "@/components/layout/protected-layout";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout allowedRoles={["customer"]}>{children}</ProtectedLayout>
  );
}
