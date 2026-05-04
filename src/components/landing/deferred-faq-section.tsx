"use client";

import dynamic from "next/dynamic";

const FAQSection = dynamic(
  () =>
    import("@/components/landing/faq-section").then((mod) => mod.FAQSection),
  { ssr: false }
);

export function DeferredFAQSection() {
  return <FAQSection />;
}
