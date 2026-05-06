import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { ArticleRecord } from "./registry";

export default function ArticleLayout({ article, children }: { article: ArticleRecord; children: ReactNode }) {
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
        <footer style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.25)" }}>
          <p className="dash-sub" style={{ margin: 0 }}>
            Play free-to-play fantasy and join the conversation on{" "}
            <Link to="/auth?mode=register">WakiBet</Link>.
          </p>
        </footer>
      </article>
    </div>
  );
}
