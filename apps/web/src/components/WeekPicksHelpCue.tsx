import { Link } from "react-router-dom";
import { usePicksSpotlight } from "../hooks/usePicksSpotlight";

type Sport = "volleyball" | "pickleball";

const HREF_FALLBACK: Record<Sport, string> = {
  volleyball: "/volleyball-picks",
  pickleball: "/week-picks",
};

export default function WeekPicksHelpCue({ sport }: { sport: Sport }) {
  const { item } = usePicksSpotlight();
  const row = item(sport === "volleyball" ? "volleyball" : "pickleball");
  const href = row?.href ?? HREF_FALLBACK[sport];

  return (
    <p className="week-picks-help-cue">
      Need help?{" "}
      <Link className="week-picks-help-cue__link" to={href}>
        Check this week&apos;s picks
      </Link>{" "}
      →
    </p>
  );
}
