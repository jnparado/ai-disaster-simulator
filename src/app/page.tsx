import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";

function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      Loading disaster simulator...
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  );
}
