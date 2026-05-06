import { ARTICLE_REDDIT_DISCUSSION_URLS } from "./redditThreadUrls";

type Props = {
  slug: string;
};

export default function ArticleRedditCta({ slug }: Props) {
  const href = ARTICLE_REDDIT_DISCUSSION_URLS[slug];
  if (!href) return null;
  return (
    <p style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(148, 163, 184, 0.28)" }}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        Join the Discussion at Reddit
      </a>
    </p>
  );
}
