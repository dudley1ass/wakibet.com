import { Link } from "react-router-dom";

type Sport = "nascar" | "pickleball";

export default function WeekPicksPromoBanner({ sport }: { sport: Sport }) {
  const href = sport === "nascar" ? "/nascar-texas-picks" : "/ppa-atlanta-picks";
  const linkInner =
    sport === "nascar" ? (
      <>
        See picks for <strong>Texas Motor Speedway</strong>
      </>
    ) : (
      <>
        See picks for <strong>PPA Atlanta</strong>
      </>
    );

  return (
    <div className="week-picks-promo-banner" role="region" aria-label="This week's picks">
      <span className="week-picks-promo-banner__fire" aria-hidden>
        🔥
      </span>
      <span className="week-picks-promo-banner__text">
        See This Week&apos;s Picks —{" "}
        <Link className="week-picks-promo-banner__link" to={href}>
          {linkInner}
        </Link>
      </span>
    </div>
  );
}
