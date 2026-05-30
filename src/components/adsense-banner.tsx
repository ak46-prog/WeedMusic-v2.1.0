'use client';

import { useEffect } from 'react';

export function AdSenseBanner() {
  useEffect(() => {
    // Load Google AdSense script
    const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
    if (!adsenseId) return;

    const existingScript = document.querySelector(
      'script[src*="pagead2.googlesyndication.com"]'
    );
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, []);

  const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  if (!adsenseId) return null;

  return (
    <div className="fixed bottom-20 left-4 z-30 w-[300px] h-[250px] rounded-xl overflow-hidden shadow-2xl shadow-black/30 border border-border/30 bg-background/80 backdrop-blur-sm hidden lg:block">
      <div className="relative w-full h-full">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '300px', height: '250px' }}
          data-ad-client={adsenseId}
          data-ad-slot={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT || 'auto'}
          data-ad-format="rectangle"
          data-full-width-responsive="false"
        />
      </div>
      {/* Close button */}
      <button
        onClick={(e) => {
          const container = (e.target as HTMLElement).closest('.fixed');
          if (container) container.remove();
        }}
        className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center hover:bg-black/80 transition-colors z-10"
      >
        ✕
      </button>
    </div>
  );
}
