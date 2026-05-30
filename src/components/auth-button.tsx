'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LogIn, LogOut, User as UserIcon, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFirebaseAuth } from '@/lib/firebase-sync';

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut, isFirebaseEnabled } = useFirebaseAuth();
  const [signingIn, setSigningIn] = useState(false);

  if (!isFirebaseEnabled) {
    // Firebase not configured - show offline indicator
    return (
      <Badge
        variant="outline"
        className="gap-1.5 text-muted-foreground border-border/50 text-[11px] px-2 py-0.5"
      >
        <CloudOff className="size-3" />
        <span className="hidden sm:inline">Offline</span>
      </Badge>
    );
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5 h-8 px-2">
        <div className="size-4 rounded-full border-2 border-muted-foreground/30 border-t-transparent animate-spin" />
        <span className="hidden sm:inline text-xs">Loading...</span>
      </Button>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-8 px-2 hover:bg-accent/50 transition-all"
          >
            <Avatar className="size-6 ring-1 ring-orange-500/30">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback className="bg-orange-500/10 text-orange-500 text-[10px] font-bold">
                {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-xs font-medium max-w-[80px] truncate">
              {user.displayName?.split(' ')[0] || 'User'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-xs text-muted-foreground">
            <Cloud className="size-3.5 text-green-500" />
            Cloud sync active
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signOut}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={signingIn}
      onClick={async () => {
        setSigningIn(true);
        await signInWithGoogle();
        setSigningIn(false);
      }}
      className="gap-1.5 h-8 px-3 hover:bg-orange-500/10 hover:text-orange-500 transition-all"
    >
      {signingIn ? (
        <div className="size-4 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
      ) : (
        <LogIn className="size-3.5" />
      )}
      <span className="text-xs font-medium">Sign in</span>
    </Button>
  );
}
