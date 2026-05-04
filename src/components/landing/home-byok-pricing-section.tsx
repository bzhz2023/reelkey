"use client";

import dynamic from "next/dynamic";

const ByokLifetimePricing = dynamic(
  () =>
    import("@/components/price/byok-lifetime-pricing").then(
      (mod) => mod.ByokLifetimePricing
    ),
  { ssr: false }
);

export function HomeByokPricingSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="container mx-auto px-4">
        <ByokLifetimePricing />
      </div>
    </section>
  );
}
