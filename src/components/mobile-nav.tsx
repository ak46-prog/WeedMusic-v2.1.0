'use client';

import { useState } from 'react';
import { Home, Compass, Library, Crown, MoreHorizontal, Radio, Baby, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMusicStore } from '@/lib/store';
import type { ViewMode } from '@/lib/store';

const mainTabs = [
  { icon: Home, label: 'Home', view: 'home' as const, animClass: 'animate-icon-home' },
  { icon: Compass, label: 'Explore', view: 'explore' as const, animClass: 'animate-icon-explore' },
  { icon: Library, label: 'Library', view: 'library' as const, animClass: 'animate-icon-library' },
  { icon: Crown, label: 'Upgrade', view: 'upgrade' as const, animClass: 'animate-icon-crown' },
];

const moreOptions = [
  { icon: Radio, label: 'Radio & FM', view: 'radio' as ViewMode, animClass: 'animate-icon-radio' },
  { icon: Baby, label: 'Kids Mode', view: 'kids' as ViewMode, animClass: 'animate-icon-kids' },
  { icon: Car, label: 'Car Mode', view: 'car' as ViewMode, animClass: 'animate-icon-car' },
];

export function MobileNav() {
  const { view, setView, toggleChildMode } = useMusicStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isMoreActive = moreOptions.some((opt) => opt.view === view);

  const handleMoreOptionClick = (option: (typeof moreOptions)[number]) => {
    if (option.view === 'kids') {
      toggleChildMode();
    }
    setView(option.view);
    setSheetOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-[72px] left-0 right-0 z-30 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <nav className="flex items-center justify-around h-16">
          {mainTabs.map((tab) => {
            const isActive = view === tab.view;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.view}
                onClick={() => setView(tab.view)}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                  isActive
                    ? 'text-orange-500'
                    : 'text-muted-foreground active:text-foreground'
                }`}
              >
                <IconComponent
                  className={`size-5 transition-transform ${isActive ? tab.animClass : ''}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              isMoreActive
                ? 'text-orange-500'
                : 'text-muted-foreground active:text-foreground'
            }`}
          >
            <MoreHorizontal className="size-5" strokeWidth={isMoreActive ? 2.2 : 1.8} />
            <span className={`text-[10px] leading-tight ${isMoreActive ? 'font-semibold' : 'font-medium'}`}>
              More
            </span>
            {isMoreActive && (
              <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-orange-500" />
            )}
          </button>
        </nav>
      </div>

      {/* More options sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base">More Options</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4 pb-6">
            {moreOptions.map((option) => {
              const isActive = view === option.view;
              const IconComponent = option.icon;
              return (
                <Button
                  key={option.view}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`flex h-auto flex-col items-center justify-center gap-2 rounded-xl py-4 transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => handleMoreOptionClick(option)}
                >
                  <IconComponent
                    className={`size-6 ${isActive ? option.animClass : ''}`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className="text-xs font-medium">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
