import { useCallback, useEffect, useState } from "react";
import "../dashboard.css";

const ROTATE_MS = 6000;

const PRIZE_SLIDES = [
  {
    id: "pickleball-paddle",
    sport: "Pickleball",
    headline: "Tournament winner",
    prize: "New paddle of your choice",
    src: "/dashboard/season-prizes/pickleball.png",
    dotAriaLabel: "Show pickleball paddle prize",
  },
  {
    id: "pickleball-signed-ball",
    sport: "Pickleball",
    headline: "Tournament winner",
    prize: "Ben Johns signed ball (or new paddle)",
    src: "/landing/prizes/pickleball-ben-johns-signed-ball.png",
    dotAriaLabel: "Show Ben Johns signed pickleball prize",
  },
  {
    id: "pickleball-alw-signed",
    sport: "Pickleball",
    headline: "Tournament winner",
    prize: "Anna Leigh Waters signed photo (or other prizes)",
    src: "/landing/prizes/pickleball-alw-signed-photo.png",
    dotAriaLabel: "Show Anna Leigh Waters signed pickleball prize",
  },
  {
    id: "volleyball",
    sport: "Volleyball",
    headline: "Tournament winner",
    prize: "Win a new Volleyball!!!",
    src: "/landing/prizes/volleyball-wakibet-champion.png",
  },
  {
    id: "lacrosse",
    sport: "Lacrosse",
    headline: "Tournament winner",
    prize: "PLL team-of-choice jersey",
    src: "/dashboard/season-prizes/lacrosse.png",
  },
  {
    id: "poker",
    sport: "Poker",
    headline: "Tournament winner",
    prize: "WSOP champion chip prize set",
    src: "/landing/prizes/poker-wsop-chip-prize.png",
  },
] as const;

/**
 * Season prize hero — rotating images with sport captions (fade in / fade out).
 */
export default function DashboardSeasonPrizesStrip() {
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
    if (reducedMotion || PRIZE_SLIDES.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PRIZE_SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const go = useCallback((i: number) => {
    setIndex(i);
  }, []);

  return (
    <section className="dash-season-prizes-strip" aria-labelledby="dash-season-prizes-strip-title">
      <p id="dash-season-prizes-strip-title" className="dash-season-prizes-strip-kicker">
        Tournament prizes
      </p>

      <div className="dash-season-prizes-hero-stage" aria-live="polite" aria-atomic="true">
        {PRIZE_SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className={`dash-season-prizes-slide${i === index ? " dash-season-prizes-slide--active" : ""}`}
            aria-hidden={i !== index}
          >
            <div className="dash-season-prizes-slide-frame">
              <img
                className="dash-season-prizes-slide-img"
                src={slide.src}
                alt={`${slide.sport}: ${slide.prize}`}
                decoding="async"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="dash-season-prizes-slide-caption">
                <span className="dash-season-prizes-slide-sport">{slide.sport}</span>
                <span className="dash-season-prizes-slide-headline">{slide.headline}</span>
                <span className="dash-season-prizes-slide-prize">{slide.prize}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-season-prizes-dots" role="tablist" aria-label="Choose prize slide">
        {PRIZE_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`dash-season-prizes-dot${i === index ? " dash-season-prizes-dot--active" : ""}`}
            onClick={() => go(i)}
            aria-label={"dotAriaLabel" in slide && slide.dotAriaLabel ? slide.dotAriaLabel : `Show ${slide.sport} prize`}
          />
        ))}
      </div>
    </section>
  );
}
