import { Link } from "react-router-dom";

export type SportCardVariant = "pickleball" | "nascar";

type Props = {
  variant: SportCardVariant;
  icon: string;
  sportLabel: string;
  eventName: string;
  subline: string;
  statusLabel: string;
  ctaLabel: string;
  ctaTo: string;
};

export default function SportCard({
  variant,
  icon,
  sportLabel,
  eventName,
  subline,
  statusLabel,
  ctaLabel,
  ctaTo,
}: Props) {
  const rootClass = `dash-sport-card dash-sport-card--${variant}`;
  return (
    <article className={rootClass}>
      <div className="dash-sport-card__top">
        <span className="dash-sport-card__icon" aria-hidden>
          {icon}
        </span>
        <div className="dash-sport-card__titles">
          <div className="dash-sport-card__sport">{sportLabel}</div>
          <h3 className="dash-sport-card__event">{eventName}</h3>
          <p className="dash-sport-card__sub">{subline}</p>
        </div>
      </div>
      <div className="dash-sport-card__meta">
        <span className={`dash-sport-card__pill dash-sport-card__pill--${variant}`}>{statusLabel}</span>
      </div>
      <Link className="dash-sport-card__cta" to={ctaTo}>
        {ctaLabel}
      </Link>
    </article>
  );
}
