import type { ComponentType } from "react";
import { Navigate, useParams } from "react-router-dom";
import ArticleLayout from "./ArticleLayout";
import { getArticleBySlug } from "./registry";
import {
  LacrosseHighSchoolRankingsPoliticsBody,
  LacrosseTravelBallDevelopmentBody,
  LacrosseAttackCreditBody,
  LacrosseDefenseBody,
  LacrosseHighlightsVsFundamentalsBody,
  PickleballAnnaLeighWatersBadBody,
  PickleballDuprInflatedBody,
  PickleballMixedDoublesViewershipBody,
  PickleballProPredictableBody,
  PickleballMlpDallasCaptainPicksBody,
  PickleballFantasyScoringWakiPointsBody,
  Pickleball45ToProGapBody,
  Pickleball50VsProQualifiersBody,
  PickleballBangersVsDinksRecBody,
  PickleballOverratedBody,
  PokerBrandingVsSkillBody,
  PokerBraceletsOverratedBody,
  PokerGtoLessInterestingBody,
  PokerHellmuthBestAliveBody,
  PokerMainEventEnduranceBody,
  PokerBraceletsVsConsistencyBody,
  PokerMainEventSurvivalVsSkillBody,
  PokerRankingWhichIsRealBody,
  PokerWsopFantasyBody,
  PokerWsopFantasyDraftNamesBody,
  PokerWsopLeaderboardVsFeaturedPoolsBody,
  VolleyballClubHypeVsDevelopmentBody,
  VolleyballLiberosUnderratedBody,
  VolleyballPowerHittersCreditBody,
  VolleyballRotationsBody,
  VolleyballServeReceiveUnderratedBody,
  VolleyballUnderratedSkillBody,
} from "./articleBodies";
import type { ArticleSlug } from "./registry";

const BODY_BY_SLUG: Record<ArticleSlug, ComponentType> = {
  "pickleball-anna-leigh-waters-bad-for-pickleball": PickleballAnnaLeighWatersBadBody,
  "pickleball-dupr-ratings-inflated": PickleballDuprInflatedBody,
  "pickleball-pro-too-predictable": PickleballProPredictableBody,
  "pickleball-mixed-doubles-carrying-viewership": PickleballMixedDoublesViewershipBody,
  "pickleball-ppa-fantasy-captain-picks-mlp-dallas-2026": PickleballMlpDallasCaptainPicksBody,
  "pickleball-fantasy-scoring-wakipoints-explained": PickleballFantasyScoringWakiPointsBody,
  "poker-wsop-main-event-endurance-more-than-skill": PokerMainEventEnduranceBody,
  "poker-bracelets-overrated": PokerBraceletsOverratedBody,
  "poker-pros-better-at-branding-than-poker": PokerBrandingVsSkillBody,
  "poker-gto-made-poker-less-interesting": PokerGtoLessInterestingBody,
  "poker-phil-hellmuth-best-tournament-player-alive": PokerHellmuthBestAliveBody,
  "lacrosse-high-school-rankings-are-politics": LacrosseHighSchoolRankingsPoliticsBody,
  "lacrosse-travel-ball-hurting-development": LacrosseTravelBallDevelopmentBody,
  "volleyball-players-dont-understand-rotations": VolleyballRotationsBody,
  "volleyball-liberos-most-underrated-athletes": VolleyballLiberosUnderratedBody,
  "volleyball-power-hitters-get-too-much-credit": VolleyballPowerHittersCreditBody,
  "pickleball-10-players-everyone-overrates": PickleballOverratedBody,
  "lacrosse-why-defense-wins-championships": LacrosseDefenseBody,
  "volleyball-most-underrated-skill": VolleyballUnderratedSkillBody,
  "poker-wsop-fantasy-strategy-explained": PokerWsopFantasyBody,
  "poker-which-poker-ranking-is-real": PokerRankingWhichIsRealBody,
  "poker-wsop-leaderboard-vs-featured-pools": PokerWsopLeaderboardVsFeaturedPoolsBody,
  "poker-wsop-fantasy-draft-names-not-results": PokerWsopFantasyDraftNamesBody,
  "poker-bracelets-vs-consistency-not-best-player": PokerBraceletsVsConsistencyBody,
  "poker-main-event-survival-vs-skill": PokerMainEventSurvivalVsSkillBody,
  "pickleball-50-ratings-vs-pro-qualifiers": Pickleball50VsProQualifiersBody,
  "pickleball-bangers-vs-soft-game-rec": PickleballBangersVsDinksRecBody,
  "pickleball-45-to-pro-gap-ego-check": Pickleball45ToProGapBody,
  "volleyball-serve-receive-still-underrated": VolleyballServeReceiveUnderratedBody,
  "volleyball-club-hype-vs-player-development": VolleyballClubHypeVsDevelopmentBody,
  "lacrosse-attack-gets-too-much-credit": LacrosseAttackCreditBody,
  "lacrosse-highlights-vs-fundamentals": LacrosseHighlightsVsFundamentalsBody,
};

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/articles" replace />;
  const article = getArticleBySlug(slug);
  if (!article) return <Navigate to="/articles" replace />;
  const Body = BODY_BY_SLUG[article.slug];
  return (
    <ArticleLayout article={article}>
      <Body />
    </ArticleLayout>
  );
}
