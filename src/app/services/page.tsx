"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/features/services/components/service-card";
import { useServiceCategories } from "@/features/services/hooks/use-service-categories";
import { useServiceCatalog } from "@/features/services/hooks/use-services";

const PAGE_SIZE = 12;

function ServicesListing({
  initialSearch,
  initialCategoryId,
}: {
  initialSearch: string;
  initialCategoryId: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [page, setPage] = useState(1);

  const categories = useServiceCategories();
  const services = useServiceCatalog();
  const normalizedSearch = search.toLocaleLowerCase();
  const filteredItems = (services.data ?? []).filter((service) => {
    const matchesSearch =
      !normalizedSearch ||
      [service.name, service.description, service.category?.name]
        .some(
          (value) =>
            typeof value === "string" &&
            value.toLocaleLowerCase().includes(normalizedSearch),
        );
    const matchesCategory =
      categoryId === "all" ||
      service.categoryId === categoryId ||
      service.category?.id === categoryId;
    return matchesSearch && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const items = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeSearch(next: string) {
    setSearch(next);
    setPage(1);
  }

  function changeCategory(next: string) {
    setCategoryId(next);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Our services"
        description="Browse what we offer and book a time that suits you."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={changeSearch}
          placeholder="Search services"
          aria-label="Search services"
        />
        {categories.data && categories.data.length > 0 ? (
          <div
            role="group"
            aria-label="Filter by category"
            className="flex flex-wrap gap-2"
          >
            <Button
              size="sm"
              variant={categoryId === "all" ? "default" : "outline"}
              aria-pressed={categoryId === "all"}
              onClick={() => changeCategory("all")}
            >
              All
            </Button>
            {categories.data.map((category, index) => (
              <Button
                key={`${category.id}-${index}`}
                size="sm"
                variant={categoryId === category.id ? "default" : "outline"}
                aria-pressed={categoryId === category.id}
                onClick={() => changeCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {services.isPending ? (
        <CardGridSkeleton count={6} />
      ) : services.isError && !services.data ? (
        <ErrorState
          error={services.error}
          onRetry={() => void services.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No services found"
          description="Try a different search term or category."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                changeSearch("");
                changeCategory("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <div className="flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={services.isFetching}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ServicesPageContent() {
  const params = useSearchParams();
  const query = params.toString();
  const initialSearch = params.get("search")?.trim() ?? "";
  const initialCategoryId = params.get("categoryId") || "all";
  return (
    <ServicesListing
      key={query}
      initialSearch={initialSearch}
      initialCategoryId={initialCategoryId}
    />
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={6} />}>
      <ServicesPageContent />
    </Suspense>
  );
}
