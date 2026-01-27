'use client';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 text-center">
      <p className="text-white text-lg">⚠️ {error}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
