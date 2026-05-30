'use client';

import { Crown, Check, X, Music, Headphones, Download, Car, Video, Baby, Radio, Newspaper, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const benefits = [
  { icon: Music, label: 'Ad-free music listening', color: 'text-orange-500' },
  { icon: Headphones, label: 'High quality audio (320kbps)', color: 'text-green-500' },
  { icon: Download, label: 'Offline downloads', color: 'text-emerald-500' },
  { icon: Car, label: 'Android Auto support', color: 'text-orange-500' },
  { icon: Video, label: 'Video streaming (up to 1080p)', color: 'text-green-500' },
  { icon: Baby, label: 'Kids mode with content filtering', color: 'text-emerald-500' },
  { icon: Radio, label: 'Live radio & FM stations', color: 'text-orange-500' },
  { icon: Newspaper, label: 'News & updates', color: 'text-green-500' },
  { icon: Play, label: 'Background play', color: 'text-emerald-500' },
];

const faqs = [
  {
    question: 'What is included in the free trial?',
    answer:
      'The 14-day free trial includes all Premium features — ad-free music, 320kbps audio, offline downloads, background play, and more. You can cancel anytime before the trial ends and you won\'t be charged.',
  },
  {
    question: 'Can I switch between plans?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. When upgrading, the price difference is prorated. When downgrading, the new plan starts at the end of your current billing cycle.',
  },
  {
    question: 'How does the Family plan work?',
    answer:
      'The Family plan allows up to 6 accounts under one subscription. Each member gets their own personal library, recommendations, and offline downloads. Kids profiles come with built-in content filtering for safe listening.',
  },
  {
    question: 'Is offline downloading available on all devices?',
    answer:
      'Offline downloads are available on Android, iOS, and desktop apps. You can download up to 500 songs per device on Premium and unlimited songs on Family plans. Downloads remain available as long as your subscription is active.',
  },
];

export function UpgradeView() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-orange-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        {/* Decorative floating elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-green-300/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          {/* Crown badge */}
          <Badge className="mb-6 bg-white/20 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm font-medium shadow-lg">
            <Crown className="size-4 mr-1.5 fill-yellow-300 text-yellow-300" />
            PREMIUM
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 sm:mb-6">
            Upgrade to{' '}
            <span className="bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
              weedmusic
            </span>{' '}
            Premium
          </h1>

          <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mb-8 sm:mb-10 leading-relaxed">
            Unlock the full experience — ad-free music, crystal-clear audio, offline downloads, and so much more.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-white/90 font-bold text-base sm:text-lg px-8 sm:px-10 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              <Sparkles className="size-5 mr-2 group-hover:rotate-12 transition-transform" />
              Start Free Trial
            </Button>
            <span className="text-white/60 text-sm">14 days free, cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Everything you get with{' '}
            <span className="bg-gradient-to-r from-green-500 to-orange-500 bg-clip-text text-transparent">
              Premium
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Enjoy an uninterrupted, high-quality music experience across all your devices.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {benefits.map((benefit) => (
            <Card
              key={benefit.label}
              className="group relative overflow-hidden border-muted/60 hover:border-orange-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5"
            >
              <CardContent className="flex flex-col items-center text-center gap-3 py-6 px-4">
                <div className={`size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-green-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <benefit.icon className={`size-6 sm:size-7 ${benefit.color}`} />
                </div>
                <span className="text-sm sm:text-base font-medium leading-snug">{benefit.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Choose your{' '}
              <span className="bg-gradient-to-r from-green-500 to-orange-500 bg-clip-text text-transparent">
                plan
              </span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Pick the plan that fits your vibe. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
            {/* Free Tier */}
            <Card className="border-muted/60 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="items-center text-center pb-2">
                <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Music className="size-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">Free</CardTitle>
                <CardDescription className="text-base">
                  <span className="font-semibold text-foreground">₹0</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { text: 'Basic features', included: true },
                  { text: 'Ad-supported', included: true },
                  { text: '128kbps audio', included: true },
                  { text: 'Ad-free listening', included: false },
                  { text: 'Offline downloads', included: false },
                  { text: 'Background play', included: false },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    {item.included ? (
                      <Check className="size-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="size-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={`text-sm ${item.included ? '' : 'text-muted-foreground/50 line-through'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4 rounded-full border-muted-foreground/20 hover:bg-muted"
                >
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Premium Tier (Highlighted) */}
            <Card className="relative border-2 border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02] md:scale-105 hover:shadow-2xl hover:shadow-orange-500/15 transition-shadow duration-300">
              {/* Glow effect */}
              <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-green-500 to-orange-500 opacity-20 blur-sm -z-10" />
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-orange-500/50 via-green-500/50 to-orange-500/50 opacity-30 -z-10 animate-pulse" />

              {/* Most Popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-orange-500 to-green-500 text-white border-0 px-4 py-1 text-xs font-bold shadow-lg">
                  <Crown className="size-3 mr-1 fill-white" />
                  MOST POPULAR
                </Badge>
              </div>

              <CardHeader className="items-center text-center pb-2 pt-4">
                <div className="size-14 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/20">
                  <Crown className="size-7 text-white fill-white/30" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                  Premium
                </CardTitle>
                <CardDescription className="text-base">
                  <span className="font-bold text-foreground text-2xl">₹99</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'All premium features',
                  'Ad-free listening',
                  '320kbps high quality audio',
                  'Offline downloads',
                  'Car mode & Android Auto',
                  'Background play',
                  'Video streaming up to 1080p',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
                <Button
                  size="lg"
                  className="w-full mt-4 rounded-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <Sparkles className="size-4 mr-2" />
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Family Tier */}
            <Card className="border-muted/60 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="items-center text-center pb-2">
                <div className="size-14 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-2">
                  <Headphones className="size-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Family</CardTitle>
                <CardDescription className="text-base">
                  <span className="font-semibold text-foreground">₹149</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Up to 6 accounts',
                  'All premium features',
                  'Kids profiles with filtering',
                  'Ad-free for everyone',
                  '320kbps audio for all',
                  'Individual recommendations',
                  'Shared family mix',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
                <Button
                  size="lg"
                  className="w-full mt-4 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Frequently asked{' '}
            <span className="bg-gradient-to-r from-green-500 to-orange-500 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Everything you need to know about weedmusic Premium.
          </p>
        </div>

        <Card className="border-muted/60">
          <CardContent className="p-4 sm:p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:no-underline hover:text-orange-500 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-orange-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 py-14 sm:py-20">
          <Crown className="size-10 sm:size-12 text-yellow-300 fill-yellow-300/30 mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to go Premium?
          </h2>
          <p className="text-white/70 text-sm sm:text-base max-w-md mb-8">
            Join millions of listeners enjoying ad-free, high-quality music. Start your 14-day free trial today.
          </p>
          <Button
            size="lg"
            className="bg-white text-green-700 hover:bg-white/90 font-bold text-base px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <Sparkles className="size-5 mr-2 group-hover:rotate-12 transition-transform" />
            Start Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
