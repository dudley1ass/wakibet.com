import { useCallback, useEffect, useState } from "react";

const ROTATE_MS = 6500;

const SEASON_PRIZES = [
  {
    id: "first",
    emoji: "🥇",
    headline: "1st place",
    prize: "WakiBet Champion Hat",
    tag: "Season leaderboard",
  },
  {
    id: "underdog",
    emoji: "🎯",
    headline: "Best underdog pick",
    prize: "Limited WakiBet founders hat",
    tag: "Special category",
  },
  {
    id: "climb",
    emoji: "📈",
    headline: "Biggest climb",
    prize: "Limited WakiBet founders hat",
    tag: "Special category",
  },
] as const;

export default function DashboardPrizeHero() {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || SEASON_PRIZES.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SEASON_PRIZES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const go = useCallback((i: number) => {
    setIndex(i);
  }, []);

  const current = SEASON_PRIZES[index]!;

  return (
    <section className="dash-prize-hero" aria-labelledby="dash-prize-hero-heading">
      <div className="dash-prize-hero-inner">
        <p id="dash-prize-hero-heading" className="dash-prize-hero-kicker">
          Season prizes
        </p>
        <div className="dash-prize-hero-stage" aria-live="polite" aria-atomic="true">
          <div key={current.id} className="dash-prize-hero-slide">
            <span className="dash-prize-hero-emoji" aria-hidden>
              {current.emoji}
            </span>
            <h2 className="dash-prize-hero-headline">{current.headline}</h2>
            <p className="dash-prize-hero-prize">{current.prize}</p>
            <p className="dash-prize-hero-tag">{current.tag}</p>
          </div>
        </div>
        <div className="dash-prize-hero-dots" role="tablist" aria-label="Choose prize to display">
          {SEASON_PRIZES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`dash-prize-hero-dot${i === index ? " dash-prize-hero-dot--active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Show: ${p.headline}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
