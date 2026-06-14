import { Suspense } from "react";
import { IntegrationsContent } from "@/components/dashboard/IntegrationsContent";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4 px-6 pt-24">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
