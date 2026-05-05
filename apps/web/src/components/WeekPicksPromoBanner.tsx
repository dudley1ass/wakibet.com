import { Link } from "react-router-dom";

type Sport = "volleyball" | "pickleball";

export default function WeekPicksPromoBanner({ sport }: { sport: Sport }) {
  const href = sport === "volleyball" ? "/volleyball" : "/week-picks";
  const linkInner =
    sport === "volleyball" ? (
      <>
        See picks for <strong>Huntington Beach Open</strong>
      </>
    ) : (
      <>
        See picks for <strong>MLP Dallas</strong> and Volleyball
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
