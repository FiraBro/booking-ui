"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { personName } from "@/features/bookings/lib/display";
import type { SlotStaff } from "@/features/bookings/lib/slots";
import { useStaffList } from "@/features/staff/hooks/use-staff";
import { cn, getInitials } from "@/lib/utils";

interface StaffStepProps {
  /** Staff members who are free at the chosen time. */
  options: SlotStaff[];
  /** "any" or a staff id. */
  value: string;
  onChange: (value: string, name: string | null) => void;
}

interface ChoiceProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  anyone?: boolean;
}

function Choice({
  selected,
  onSelect,
  title,
  subtitle,
  avatarUrl,
  anyone,
}: ChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary bg-primary/5 ring-2 ring-primary/30",
      )}
    >
      <Avatar className="size-10">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>
          {anyone ? (
            <Users className="size-4" aria-hidden />
          ) : (
            getInitials(title)
          )}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        {subtitle ? (
          <span className="block truncate text-sm text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function StaffStep({ options, value, onChange }: StaffStepProps) {
  const directory = useStaffList({ page: 1, pageSize: 100 });
  const byId = new Map(
    (directory.data?.items ?? []).map((member) => [member.id, member]),
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Several people are available at this time. Choose one, or let us assign
        whoever is free.
      </p>
      <div
        role="group"
        aria-label="Staff member"
        className="grid gap-3 sm:grid-cols-2"
      >
        <Choice
          anyone
          title="Any available"
          subtitle="We'll assign the best match"
          selected={value === "any"}
          onSelect={() => onChange("any", null)}
        />
        {options.map((option) => {
          const member = byId.get(option.id);
          const name = member
            ? personName(member, option.name ?? "Staff member")
            : (option.name ?? "Staff member");
          return (
            <Choice
              key={option.id}
              title={name}
              subtitle={member?.title}
              avatarUrl={member?.avatarUrl}
              selected={value === option.id}
              onSelect={() => onChange(option.id, name)}
            />
          );
        })}
      </div>
    </div>
  );
}
