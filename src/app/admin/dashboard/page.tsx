import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
      <p className="text-sm text-muted-foreground">
        You are signed in. The full dashboard is replaced in Batch 5.
      </p>
    </div>
  );
}
