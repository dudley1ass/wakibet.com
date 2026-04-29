import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PickCard({
  icon: Icon,
  title,
  children,
  accent = "text-yellow-400",
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-xl">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-slate-800 p-2">
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>
      <div className="space-y-3 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}

export function PlayerRow({ name, note }: { name: string; note: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
      <p className="font-bold text-white">{name}</p>
      <p className="mt-1 text-sm text-slate-300">{note}</p>
    </div>
  );
}

export function Hero({
  sport,
  title,
  subtitle,
  badge,
  ctaHref,
  ctaText,
  icon: Icon,
}: {
  sport: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaHref: string;
  ctaText: string;
  icon: LucideIcon;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-7 shadow-2xl md:p-10">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300">
          <Icon className="h-4 w-4" />
          {badge}
        </div>
        <p className="mb-2 text-sm font-black uppercase tracking-[0.25em] text-slate-400">{sport}</p>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{subtitle}</p>
        <Link
          to={ctaHref}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-yellow-500 px-6 py-3 font-black text-slate-950 shadow-lg transition hover:bg-yellow-400"
        >
          {ctaText} <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
