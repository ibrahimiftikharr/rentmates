import { Home } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl">Rentmates</span>
        </div>
      </div>
    </header>
  );
}
