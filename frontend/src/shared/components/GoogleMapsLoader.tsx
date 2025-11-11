import { useEffect, useState, ReactNode } from 'react';

interface GoogleMapsLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function GoogleMapsLoader({ children, fallback = null }: GoogleMapsLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Wait for Google Maps to load
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        clearInterval(checkGoogleMaps);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(checkGoogleMaps);
  }, []);

  if (!isLoaded) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
