"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold">出错了</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>重试</Button>
    </main>
  );
}
