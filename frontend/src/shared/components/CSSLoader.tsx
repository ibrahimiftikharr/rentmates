import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function CSSLoader() {
  const location = useLocation();

  useEffect(() => {
    // Determine which CSS to load based on route
    let cssFiles: string[] = [];
    
    if (location.pathname.startsWith('/landlord')) {
      cssFiles = [
        '/src/domains/landlord/styles/index-full.css',
        '/src/domains/landlord/styles/globals-full.css'
      ];
    } else if (location.pathname.startsWith('/student')) {
      cssFiles = [
        '/src/domains/student/styles/index.css',
        '/src/domains/student/styles/globals.css'
      ];
    } else if (location.pathname.startsWith('/investor')) {
      cssFiles = ['/src/domains/investor/styles/index.css'];
    } else {
      // Default to auth styles for /auth, /reset-password, /, and any other route
      cssFiles = [
        '/src/domains/auth/styles/index.css',
        '/src/domains/auth/styles/globals.css'
      ];
    }

    // Preload new CSS files before removing old ones
    const newLinks: HTMLLinkElement[] = [];
    let loadedCount = 0;
    const dashboard = location.pathname.split('/')[1] || 'auth';

    cssFiles.forEach((href, index) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-dashboard-css', 'true');
      link.setAttribute('data-dashboard', dashboard);
      link.setAttribute('data-index', index.toString());
      
      // Wait for CSS to load before removing old CSS
      link.onload = () => {
        loadedCount++;
        // Once all new CSS files are loaded, remove old CSS
        if (loadedCount === cssFiles.length) {
          const existingLinks = document.querySelectorAll(`link[data-dashboard-css]:not([data-dashboard="${dashboard}"])`);
          existingLinks.forEach(oldLink => oldLink.remove());
          console.log(`[CSSLoader] Loaded CSS for: ${location.pathname}`);
        }
      };

      // Add error handling
      link.onerror = () => {
        console.error(`[CSSLoader] Failed to load: ${href}`);
        loadedCount++;
        if (loadedCount === cssFiles.length) {
          const existingLinks = document.querySelectorAll(`link[data-dashboard-css]:not([data-dashboard="${dashboard}"])`);
          existingLinks.forEach(oldLink => oldLink.remove());
        }
      };

      newLinks.push(link);
      document.head.appendChild(link);
    });
  }, [location.pathname]);

  return null;
}
