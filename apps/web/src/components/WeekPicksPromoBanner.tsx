import { Link } from "react-router-dom";
import { usePicksSpotlight } from "../hooks/usePicksSpotlight";

type Sport = "volleyball" | "pickleball";

export default function WeekPicksPromoBanner({ sport }: { sport: Sport }) {
  const { item } = usePicksSpotlight();
  const vb = item("volleyball");
  const pb = item("pickleball");

  const href = sport === "volleyball" ? vb?.href ?? "/volleyball-picks" : pb?.href ?? "/week-picks";
  const vbVenue = vb?.venue ?? "Huntington Beach Open";
  const pbVenue = pb?.venue ?? "MLP Dallas";

  const linkInner =
    sport === "volleyball" ? (
      <>
        See picks for <strong>{vbVenue}</strong>
      </>
    ) : (
      <>
        See picks for <strong>{pbVenue}</strong> and <strong>{vbVenue}</strong>
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
