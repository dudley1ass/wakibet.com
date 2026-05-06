import type { ComponentType } from "react";
import { Navigate, useParams } from "react-router-dom";
import ArticleLayout from "./ArticleLayout";
import { getArticleBySlug } from "./registry";
import {
  LacrosseAttackCreditBody,
  LacrosseDefenseBody,
  LacrosseHighlightsVsFundamentalsBody,
  Pickleball45ToProGapBody,
  Pickleball50VsProQualifiersBody,
  PickleballBangersVsDinksRecBody,
  PickleballOverratedBody,
  PokerBraceletsVsConsistencyBody,
  PokerMainEventSurvivalVsSkillBody,
  PokerRankingWhichIsRealBody,
  PokerWsopFantasyBody,
  PokerWsopFantasyDraftNamesBody,
  PokerWsopLeaderboardVsFeaturedPoolsBody,
  VolleyballClubHypeVsDevelopmentBody,
  VolleyballServeReceiveUnderratedBody,
  VolleyballUnderratedSkillBody,
} from "./articleBodies";
import type { ArticleSlug } from "./registry";

const BODY_BY_SLUG: Record<ArticleSlug, ComponentType> = {
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
