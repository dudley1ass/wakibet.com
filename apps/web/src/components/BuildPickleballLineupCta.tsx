import { Link } from "react-router-dom";

export function buildPickleballLineupSubtext(tournamentName?: string, venue?: string): string {
  if (tournamentName && venue) {
    return `${tournamentName} · ${venue} · free · no account needed to start`;
  }
  if (tournamentName) {
    return `${tournamentName} · pick players for this week's pro slate · free`;
  }
  return "This week's pro tournament · pick players under the cap · free to try";
}

type Props = {
  href?: string;
  tournamentName?: string;
  venue?: string;
  className?: string;
  onClick?: () => void;
};

export default function BuildPickleballLineupCta({
  href = "/pick-teams",
  tournamentName,
  venue,
  className = "",
  onClick,
}: Props) {
  return (
    <Link
      className={`dash-main-btn landing-cta-lineup landing-cta-lineup--build ${className}`.trim()}
      to={href}
      onClick={onClick}
    >
      <span className="landing-cta-lineup__title">Build your pickleball lineup</span>
      <span className="landing-cta-lineup__sub">{buildPickleballLineupSubtext(tournamentName, venue)}</span>
    </Link>
  );
}
