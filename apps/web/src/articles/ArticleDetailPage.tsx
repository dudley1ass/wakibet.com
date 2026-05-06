import { Navigate, useParams } from "react-router-dom";
import ArticleLayout from "./ArticleLayout";
import { getArticleBySlug } from "./registry";
import {
  LacrosseDefenseBody,
  PickleballOverratedBody,
  PokerWsopFantasyBody,
  VolleyballUnderratedSkillBody,
} from "./articleBodies";

const BODY_BY_SLUG = {
  "pickleball-10-players-everyone-overrates": PickleballOverratedBody,
  "lacrosse-why-defense-wins-championships": LacrosseDefenseBody,
  "volleyball-most-underrated-skill": VolleyballUnderratedSkillBody,
  "poker-wsop-fantasy-strategy-explained": PokerWsopFantasyBody,
} as const;

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
