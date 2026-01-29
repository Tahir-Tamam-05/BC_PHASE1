import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Waves, Home } from 'lucide-react';
import { OceanBackground } from '@/components/ocean-background';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <OceanBackground />
      
      <div className="text-center z-10">
        <Waves className="w-24 h-24 mx-auto text-white mb-6" />
        <h1 className="text-6xl font-heading font-bold text-white mb-4">404</h1>
        <p className="text-2xl text-white/90 mb-8">Page Not Found</p>
        <p className="text-white/80 mb-8 max-w-md mx-auto">
          The page you're looking for seems to have drifted away like the ocean tide.
        </p>
        <Link href="/">
          <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
