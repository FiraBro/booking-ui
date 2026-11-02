"use client";

import { Ellipsis, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: RowMenuItem[];
}) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={label}
        >
          <Ellipsis aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              {Icon ? <Icon aria-hidden /> : null}
              {item.label}
            </>
          );
          return (
            <Fragment key={item.key}>
              {item.separatorBefore ? <DropdownMenuSeparator /> : null}
              {item.href ? (
                <DropdownMenuItem asChild>
                  <Link href={item.href}>{content}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className={
                    item.destructive
                      ? "text-destructive focus:text-destructive"
                      : undefined
                  }
                  disabled={item.disabled}
                  onSelect={item.onSelect}
                >
                  {content}
                </DropdownMenuItem>
              )}
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
