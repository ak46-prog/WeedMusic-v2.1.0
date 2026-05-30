'use client';

import { Zap, Shield, Baby, Radio, LayoutGrid, Headphones, Car } from 'lucide-react';

const promos = [
  { icon: Zap, text: 'Ad-Free Listening' },
  { icon: Headphones, text: 'Free Music Streaming' },
  { icon: Shield, text: 'Car Mode Ready' },
  { icon: Baby, text: 'Kids Safe Mode' },
  { icon: Radio, text: 'Live Radio & FM' },
  { icon: LayoutGrid, text: 'Multi-Platform Access' },
  { icon: Car, text: 'Android Auto' },
];

export function PromoBanner() {
  return (
    <section className="w-full overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 via-orange-500 to-green-600 py-2.5 px-4">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {[...promos, ...promos].map((promo, i) => (
            <div key={i} className="flex items-center gap-2 text-white text-sm font-medium">
              <promo.icon className="size-4 shrink-0" />
              <span>{promo.text}</span>
              <span className="text-white/40 mx-2">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
