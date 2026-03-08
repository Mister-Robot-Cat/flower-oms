export default function Loading({ fullScreen = false }: { fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-space-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cosmic-purple-light/30 border-t-cosmic-purple-light"></div>
          <p className="text-sm text-space-text-secondary">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cosmic-purple-light/30 border-t-cosmic-purple-light"></div>
    </div>
  );
}
