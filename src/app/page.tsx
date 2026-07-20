import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Layers3,
  MessageSquareText,
  Play,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const platforms = [
  { label: "X", className: "bg-foreground text-background" },
  { label: "f", className: "bg-[#1877f2] text-white" },
  { label: "◎", className: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white" },
  { label: "♪", className: "bg-white text-black" },
  { label: "in", className: "bg-[#0a66c2] text-white" },
];

const benefits = [
  {
    icon: MessageSquareText,
    number: "01",
    title: "Create once",
    description: "Start with one clear idea instead of five blank tabs.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Adapt with AI",
    description: "Tailor the voice, format, and length for every audience.",
  },
  {
    icon: Send,
    number: "03",
    title: "Publish with confidence",
    description: "Keep delivery status for every channel in one place.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[38rem] bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(255,255,255,0.10),transparent)]" />

      <header className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Centro home">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">Centro</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Account navigation">
          <Button asChild variant="ghost" className="px-3 sm:px-4">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-4 sm:px-5">
            <Link href="/signup">Get started <ArrowRight className="ml-1.5" /></Link>
          </Button>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10 lg:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(74,222,128,0.45)]" />
            Your social command center
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-8xl">
            One post. Every
            <span className="block text-white/45">place it matters.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Centro helps social teams create, adapt, and publish on every channel — all from one focused workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm">
              <Link href="/signup">Start creating free <ArrowRight className="ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full border-white/15 bg-white/[0.02] px-6 text-sm hover:bg-white/[0.07]">
              <Link href="#how-it-works"><Play className="mr-2 size-3.5 fill-current" /> See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
        </div>

        <ProductPreview />
      </section>

      <section className="relative z-10 border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 py-7 sm:flex-row sm:justify-between sm:px-8 lg:px-10">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Built for the places your work shows up</p>
          <div className="flex items-center gap-5 text-sm font-medium text-muted-foreground sm:gap-7">
            <span>Instagram</span><span>LinkedIn</span><span>TikTok</span><span>Facebook</span><span className="hidden sm:inline">X</span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">A simpler social workflow</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Make your best work easier to share.</h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.09] md:grid-cols-3">
          {benefits.map(({ icon: Icon, number, title, description }) => (
            <article key={number} className="min-h-60 bg-[#101012] p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"><Icon className="size-4 text-white/85" /></span>
                <span className="font-mono text-xs text-muted-foreground">{number}</span>
              </div>
              <h3 className="mt-12 text-xl font-medium tracking-tight">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#19191d] to-[#0e0e10] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]"><Layers3 className="size-5" /></div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Your social presence, finally in sync.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">Spend less time moving content between platforms and more time making it worth sharing.</p>
            <Button asChild size="lg" className="mt-7 h-12 rounded-full px-6">
              <Link href="/signup">Create your workspace <ArrowRight className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2"><BrandMark /><span className="font-medium text-foreground">Centro</span><span className="ml-1 text-white/25">© 2026</span></div>
          <div className="flex gap-5"><Link className="transition-colors hover:text-foreground" href="/login">Sign in</Link><Link className="transition-colors hover:text-foreground" href="/signup">Get started</Link></div>
        </div>
      </footer>
    </main>
  );
}

function BrandMark() {
  return (
    <span className="grid size-7 place-items-center rounded-[8px] bg-foreground text-background shadow-[0_0_22px_rgba(255,255,255,0.16)]">
      <span className="size-2.5 rounded-[3px] border-2 border-background" />
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="mx-auto mt-14 max-w-5xl sm:mt-16">
      <div className="rounded-xl border border-white/[0.13] bg-[#111114] p-1.5 shadow-[0_32px_100px_-35px_rgba(0,0,0,0.95),0_0_80px_-30px_rgba(255,255,255,0.20)]">
        <div className="overflow-hidden rounded-[7px] border border-white/[0.07] bg-[#0c0c0e]">
          <div className="flex h-10 items-center border-b border-white/[0.07] px-3 sm:px-4">
            <div className="flex gap-1.5"><span className="size-2 rounded-full bg-white/15" /><span className="size-2 rounded-full bg-white/15" /><span className="size-2 rounded-full bg-white/15" /></div>
            <div className="mx-auto hidden rounded bg-white/[0.045] px-16 py-1 font-mono text-[9px] text-muted-foreground sm:block">centro.app/compose</div>
          </div>
          <div className="grid min-h-[300px] sm:min-h-[390px] md:grid-cols-[144px_1fr]">
            <aside className="hidden border-r border-white/[0.07] p-3 md:block">
              <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium"><BrandMark /> Centro</div>
              <div className="mt-6 space-y-1 font-mono text-[10px] text-muted-foreground">
                <p className="rounded bg-white/[0.07] px-2.5 py-2 text-foreground">✦ &nbsp; Compose</p><p className="px-2.5 py-2">⊞ &nbsp; Dashboard</p><p className="px-2.5 py-2">◫ &nbsp; Calendar</p><p className="px-2.5 py-2">◌ &nbsp; Analytics</p>
              </div>
            </aside>
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">New post</p><h3 className="mt-1 text-lg font-medium tracking-tight sm:text-xl">Compose</h3></div><span className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-muted-foreground">Saved just now</span></div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-white/[0.09] bg-white/[0.025] p-4">
                  <p className="text-xs leading-5 text-white/80 sm:text-sm">The next chapter is here. Built with focus, made to move fast, and ready for what&apos;s next. ✦</p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3"><div className="flex gap-2 text-muted-foreground"><span>⌁</span><span>◉</span><span>☺</span></div><span className="font-mono text-[10px] text-muted-foreground">104 / 2,200</span></div>
                </div>
                <div className="rounded-lg border border-white/[0.09] bg-white/[0.025] p-3.5">
                  <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Adapting for</p><Sparkles className="size-3.5 text-white/70" /></div>
                  <div className="mt-3 space-y-2">
                    {platforms.slice(0, 3).map((platform, index) => (<div key={platform.label} className="flex items-center gap-2 rounded-md bg-white/[0.04] p-2"><span className={`grid size-5 place-items-center rounded text-[9px] font-bold ${platform.className}`}>{platform.label}</span><span className="font-mono text-[10px] text-white/75">{["LinkedIn", "Instagram", "X / Twitter"][index]}</span><CircleCheck className="ml-auto size-3.5 text-emerald-400" /></div>))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between"><div className="flex -space-x-1.5">{platforms.map((platform) => <span key={platform.label} className={`grid size-6 place-items-center rounded-full border-2 border-[#0c0c0e] text-[9px] font-bold ${platform.className}`}>{platform.label}</span>)}</div><span className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background">Publish now <ChevronRight className="size-3" /></span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Check className="size-3 text-emerald-400" /> Platform-native versions</span><span className="inline-flex items-center gap-1.5"><Check className="size-3 text-emerald-400" /> One clear status view</span></div>
    </div>
  );
}
