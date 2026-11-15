"use client";
import { ErrorState } from "@/components/shared/states";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState retry={reset} />;
}
