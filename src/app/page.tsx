import { Bell, CalendarCheck, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { FeaturedServices } from "@/features/services/components/featured-services";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Book in seconds",
    description:
      "Pick a service, choose a time that suits you and confirm. Only real, open times are shown.",
  },
  {
    icon: CreditCard,
    title: "Pay securely online",
    description:
      "Check out with our payment partner. Your card details never touch our servers.",
  },
  {
    icon: Bell,
    title: "Stay in the loop",
    description:
      "Get notified when your booking is confirmed, changed or about to start.",
  },
  {
    icon: ShieldCheck,
    title: "Flexible changes",
    description:
      "Reschedule or cancel from your dashboard, within the provider's cancellation window.",
  },
] as const;

const STEPS = [
  {
    title: "Choose a service",
    description: "Browse by category and compare duration and price.",
  },
  {
    title: "Pick a time",
    description:
      "Select a date and an available slot, and a staff member if you like.",
  },
  {
    title: "Confirm and pay",
    description:
      "Review the details, confirm, and pay online whenever you're ready.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <section className="border-b bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Book the services you need,{" "}
              <span className="text-primary">when it suits you</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Discover services, see live availability and manage your
              appointments, payments and reminders in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href={ROUTES.customer.newBooking}>Book now</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.services}>Browse services</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="featured-heading"
          className="mx-auto max-w-6xl space-y-6 px-4 py-14 sm:px-6"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="featured-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                Popular services
              </h2>
              <p className="text-sm text-muted-foreground">
                A few places to start.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href={ROUTES.services}>View all</Link>
            </Button>
          </div>
          <FeaturedServices />
        </section>

        <section aria-labelledby="how-heading" className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6">
            <h2
              id="how-heading"
              className="text-center text-2xl font-semibold tracking-tight"
            >
              How it works
            </h2>
            <ol className="grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="space-y-2 text-center">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6"
        >
          <h2
            id="features-heading"
            className="text-center text-2xl font-semibold tracking-tight"
          >
            Everything in one place
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className="space-y-2 rounded-lg border bg-card p-5"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-14 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to book your first appointment?
            </h2>
            <p className="mx-auto max-w-xl text-sm opacity-90">
              Create a free account to manage your bookings and get reminders.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.register}>Create an account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
