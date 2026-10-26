export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing glow background */}
        <div className="absolute size-20 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Spinning border ring */}
        <div className="size-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        
        {/* Center dot/icon */}
        <div className="absolute size-3 rounded-full bg-primary animate-ping" />
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="font-semibold text-lg tracking-tight">Alpha Study Circle</h2>
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading content, please wait…
        </p>
      </div>
    </div>
  );
}
