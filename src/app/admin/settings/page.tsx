"use client";

import { ErrorState } from "@/components/shared/error-state";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/features/auth/components/account-settings";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { useSettings } from "@/features/settings/hooks/use-settings";

export default function AdminSettingsPage() {
  const query = useSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Business details, booking rules and your own account."
      />

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="account">My account</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          {query.isPending ? (
            <FormSkeleton fields={6} className="max-w-3xl" />
          ) : query.isError || !query.data ? (
            <ErrorState
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : (
            <SettingsForm
              key={JSON.stringify(query.data)}
              settings={query.data}
            />
          )}
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
