import { useCallback, useEffect, useState } from "react";

const ROTATE_MS = 6000;

const SLIDES = [
  {
    id: "poker",
    kicker: "Poker winner prize",
    src: "/landing/prizes/poker-wsop-chip-prize.png",
    alt: "WakiBet WSOP champion poker chip prize set",
    tall: true,
  },
  {
    id: "pickleball-paddle",
    kicker: "Pickleball winner prize",
    src: "/dashboard/season-prizes/pickleball.png",
    alt: "Pickleball paddle prize option",
  },
  {
    id: "pickleball-ben-johns-ball",
    kicker: "Pickleball winner prize",
    src: "/landing/prizes/pickleball-ben-johns-signed-ball.png",
    alt: "Ben Johns signed pickleball prize option",
  },
  {
    id: "pickleball-alw-signed",
    kicker: "Pickleball winner prize",
    src: "/landing/prizes/pickleball-alw-signed-photo.png",
    alt: "Anna Leigh Waters signed 8×10 photo with PSA authentication",
  },
  {
    id: "volleyball",
    kicker: "Volleyball winner prize",
    src: "/landing/prizes/volleyball-wakibet-champion.png",
    alt: "WakiBet branded champion volleyball prize graphic",
  },
  {
    id: "lacrosse",
    kicker: "Lacrosse winner prize",
    src: "/dashboard/season-prizes/lacrosse.png",
    alt: "PLL team jersey prize graphic",
  },
] as const;

/**
 * Featured tournament prizes on the marketing hero — rotated with crossfade and dots (mirrors dashboard logic).
 */
export default function LandingHeroPrizesRotator() {
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
    if (reducedMotion || SLIDES.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const go = useCallback((i: number) => {
    setIndex(i);
  }, []);

  return (
    <div className="landing-hero-prize-rotator" aria-label="Featured tournament prizes carousel">
      <p className="landing-hero-prize-rotator__eyebrow">Tournament prizes</p>

      <div className="landing-hero-prize-rotator__stage" aria-live="polite" aria-atomic="true">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className={`landing-hero-prize-rotator__slide${i === index ? " landing-hero-prize-rotator__slide--active" : ""}`}
            aria-hidden={i !== index}
          >
            <article className="landing-hero-prize-rotator__card">
              <p className="landing-hero-prize-rotator__kicker">{slide.kicker}</p>
              <img
                className={`landing-hero-prize-rotator__img${"tall" in slide && slide.tall ? " landing-hero-prize-rotator__img--tall" : ""}`}
                src={slide.src}
                alt={slide.alt}
                decoding="async"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </article>
          </div>
        ))}
      </div>

      <div className="landing-hero-prize-rotator__dots" role="tablist" aria-label="Choose featured prize slide">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`landing-hero-prize-rotator__dot${i === index ? " landing-hero-prize-rotator__dot--active" : ""}`}
            onClick={() => go(i)}
            aria-label={`Show ${slide.kicker}: ${slide.alt}`}
          />
        ))}
      </div>
    </div>
  );
}
