import { Link } from "react-router-dom";

export function buildLineupSubtext(tournamentName?: string, venue?: string): string {
  if (tournamentName && venue) {
    return `${tournamentName} · ${venue} · free · no account needed to start`;
  }
  if (tournamentName) {
    return `${tournamentName} · pick players for this week's slate · no account needed to start`;
  }
  return "Pick players for this week's slate · free · no account needed to start";
}

type Props = {
  sportLabel?: string;
  href?: string;
  tournamentName?: string;
  venue?: string;
  className?: string;
  onClick?: () => void;
};

export default function BuildLineupCta({
  sportLabel,
  href = "/pick-teams",
  tournamentName,
  venue,
  className = "",
  onClick,
}: Props) {
  const title = sportLabel ? `Build your ${sportLabel} lineup` : "Build a lineup";

  return (
    <Link
      className={`dash-main-btn landing-cta-lineup landing-cta-lineup--build ${className}`.trim()}
      to={href}
      onClick={onClick}
    >
      <span className="landing-cta-lineup__title">{title}</span>
      <span className="landing-cta-lineup__sub">{buildLineupSubtext(tournamentName, venue)}</span>
    </Link>
  );
}
