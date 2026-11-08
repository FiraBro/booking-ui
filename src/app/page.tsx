import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export const metadata: Metadata = {
  title: "Eventify — Find a service and book a time",
  description:
    "Discover services, compare details, and book an appointment that works for you.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main id="main-content" tabIndex={-1} className="flex flex-1 outline-none">
        <section className="flex flex-1 items-center bg-background">
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-32">
            <p className="mb-6 text-xs font-semibold tracking-[0.18em] text-primary sm:text-sm">
              SMART APPOINTMENT BOOKING
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your Time Matters.
              <span className="block">Booking Made Simple.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-8 sm:text-lg sm:leading-8">
              Discover trusted services, choose a convenient time, and manage
              your appointments effortlessly with Eventify.
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="transition-colors">
                <Link href={ROUTES.services}>Explore Services</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="transition-colors"
              >
                <Link href={ROUTES.register}>Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href={ROUTES.home} className="text-sm font-semibold tracking-tight">
              Eventify
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Discover services and book appointments with ease.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Eventify
          </p>
        </div>
      </footer>
    </div>
  );
}
