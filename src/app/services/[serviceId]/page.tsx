"use client";

import { Clock, Tag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { ServiceImage } from "@/features/services/components/service-card";
import { ServiceAvailabilityPreview } from "@/features/services/components/service-availability-preview";
import { useService } from "@/features/services/hooks/use-service";
import { formatCurrency, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const query = useService(serviceId);
  const [selectedImage, setSelectedImage] = useState(0);

  if (query.isPending) return <PageSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Service"
          back={{ href: ROUTES.services, label: "All services" }}
        />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const service = query.data;
  const gallery = Array.from(
    new Set(
      [service.imageUrl, ...service.images].filter((url): url is string =>
        Boolean(url),
      ),
    ),
  );
  const activeImage =
    gallery[Math.min(selectedImage, Math.max(gallery.length - 1, 0))];

  return (
    <div className="space-y-8">
      <PageHeader
        title={service.name}
        back={{ href: ROUTES.services, label: "All services" }}
      />

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-3">
          <ServiceImage
            key={activeImage ?? "none"}
            src={activeImage}
            alt={service.name}
            className="aspect-video w-full rounded-lg border"
          />
          {gallery.length > 1 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Service images">
              {gallery.map((url, position) => (
                <li key={url}>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(position)}
                    aria-label={`Show image ${position + 1}`}
                    aria-pressed={position === selectedImage}
                    className={cn(
                      "overflow-hidden rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      position === selectedImage && "ring-2 ring-primary",
                    )}
                  >
                    <ServiceImage src={url} alt="" className="size-16" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {service.category ? (
              <Badge variant="secondary" className="gap-1">
                <Tag className="size-3" aria-hidden />
                {service.category.name}
              </Badge>
            ) : null}
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3" aria-hidden />
              {formatDuration(service.durationMinutes)}
            </Badge>
          </div>

          <p className="tabular text-3xl font-semibold">
            {formatCurrency(service.price, service.currency)}
          </p>

          {service.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
          ) : null}

          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={ROUTES.customer.bookNow(service.id)}>
              Book this service
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            You&apos;ll be asked to sign in or create an account to book.
          </p>
        </div>
      </div>

      <ServiceAvailabilityPreview serviceId={service.id} />
    </div>
  );
}
