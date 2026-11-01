"use client";

import { Briefcase, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { formatCurrency, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <Briefcase className="size-8" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const image = service.imageUrl ?? service.images[0];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <ServiceImage
        key={image ?? "none"}
        src={image}
        alt=""
        className="h-40 w-full"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          {service.category ? (
            <Badge variant="secondary">{service.category.name}</Badge>
          ) : null}
          <h3 className="text-base font-semibold leading-tight">
            <Link
              href={ROUTES.serviceDetail(service.id)}
              className="hover:underline"
            >
              {service.name}
            </Link>
          </h3>
          {service.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {service.description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-4" aria-hidden />
            {formatDuration(service.durationMinutes)}
          </span>
          <span className="tabular font-semibold">
            {formatCurrency(service.price, service.currency)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={ROUTES.serviceDetail(service.id)}>Details</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={ROUTES.customer.bookNow(service.id)}>Book now</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
