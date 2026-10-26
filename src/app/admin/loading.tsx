import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="size-8 text-primary animate-spin mb-4" />
      <p className="text-sm font-medium text-muted-foreground">Loading admin area…</p>
    </div>
  );
}
