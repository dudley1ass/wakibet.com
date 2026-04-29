import { Link } from "react-router-dom";

type Sport = "nascar" | "pickleball";

const HREF: Record<Sport, string> = {
  nascar: "/nascar-texas-picks",
  pickleball: "/ppa-atlanta-picks",
};

export default function WeekPicksHelpCue({ sport }: { sport: Sport }) {
  return (
    <p className="week-picks-help-cue">
      Need help?{" "}
      <Link className="week-picks-help-cue__link" to={HREF[sport]}>
        Check this week&apos;s picks
      </Link>{" "}
      →
    </p>
  );
}
