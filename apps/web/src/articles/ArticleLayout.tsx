import { Link } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import type { ArticleRecord } from "./registry";
import ArticleEngagementCard from "./ArticleEngagementCard";
import { trackArticleCtaClick, trackEvent } from "../lib/analytics";

export default function ArticleLayout({ article, children }: { article: ArticleRecord; children: ReactNode }) {
  useEffect(() => {
    trackEvent("article_view", { article_slug: article.slug });
  }, [article.slug]);

  function onCopyLink() {
    const href = typeof window !== "undefined" ? window.location.href : "";
    if (!href) return;
    void navigator.clipboard.writeText(href);
    trackEvent("article_share_click", { article_slug: article.slug, channel: "copy" });
  }

  function onShareReddit() {
    trackEvent("article_share_click", { article_slug: article.slug, channel: "reddit" });
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.headline)}`
      : "https://www.reddit.com/";

  return (
    <div className="static-page-wrap">
      <article className="static-page-card" itemScope itemType="https://schema.org/Article">
        <meta itemProp="datePublished" content={article.datePublished} />
        <meta itemProp="dateModified" content={article.dateModified} />
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to="/articles">Articles</Link>
          <span aria-hidden="true"> / </span>
          <span style={{ color: "#94a3b8" }}>{article.headline}</span>
        </nav>
        <header className="dash-head" style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ margin: 0 }} itemProp="headline">
            {article.headline}
          </h1>
          <Link className="dash-ghost-btn" to="/articles">
            All articles
          </Link>
        </header>
        <p className="dash-sub" style={{ marginTop: 0 }}>
          Published <time dateTime={article.datePublished}>{article.datePublished}</time>
          {article.dateModified !== article.datePublished ? (
            <>
              {" "}
              · Updated <time dateTime={article.dateModified}>{article.dateModified}</time>
            </>
          ) : null}
          {" · "}
          <span itemProp="author" itemScope itemType="https://schema.org/Organization">
            <span itemProp="name">WakiBet</span>
          </span>
        </p>
        <p className="dash-sub" style={{ fontSize: 12 }}>
          <strong>Topics:</strong> {article.keywords.join(", ")}
        </p>
        <div className="static-page-body article-prose" itemProp="articleBody">
          {children}
        </div>
        <ArticleEngagementCard slug={article.slug} />
        <footer style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.25)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <button type="button" className="dash-ghost-btn" onClick={onCopyLink}>
              Copy article link
            </button>
            <a
              className="dash-ghost-btn"
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onShareReddit}
            >
              Share to Reddit
            </a>
          </div>
          <p className="dash-sub" style={{ margin: 0 }}>
            Play free-to-play fantasy and join the conversation on{" "}
            <Link
              to="/auth?mode=register&from=article"
              onClick={() => trackArticleCtaClick(article.slug, "register")}
            >
              WakiBet
            </Link>
            {" · "}
            <Link to="/pickleball/rankings" onClick={() => trackArticleCtaClick(article.slug, "rankings")}>
              Pickleball rankings
            </Link>
            {" · "}
            <Link to="/#demo-contest" onClick={() => trackArticleCtaClick(article.slug, "demo")}>
              Try demo contest
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
