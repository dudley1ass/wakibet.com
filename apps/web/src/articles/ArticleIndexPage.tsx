import { Link } from "react-router-dom";
import { ARTICLES } from "./registry";

export default function ArticleIndexPage() {
  return (
    <div className="static-page-wrap">
      <div className="static-page-card">
        <div className="dash-head" style={{ marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Articles</h1>
          <Link className="dash-ghost-btn" to="/">
            Home
          </Link>
        </div>
        <p className="dash-sub" style={{ marginTop: 0 }}>
          Long-form guides for fantasy lineups, rankings debates, and niche sports strategy. Each piece is written for
          fans who want substance—not clickbait—with clear takeaways you can use on WakiBet and in your league chats.
        </p>
        <ul className="static-page-body" style={{ listStyle: "none", padding: 0, margin: "16px 0 0" }}>
          {ARTICLES.map((a) => (
            <li
              key={a.slug}
              style={{
                marginBottom: 16,
                padding: 16,
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.25)",
                background: "rgba(15, 23, 42, 0.35)",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "1.15rem" }}>
                <Link to={`/articles/${a.slug}`}>{a.headline}</Link>
              </h2>
              <p className="dash-sub" style={{ margin: 0 }}>
                {a.description}
              </p>
              <p className="dash-sub" style={{ margin: "8px 0 0", fontSize: 12 }}>
                <time dateTime={a.datePublished}>{a.datePublished}</time> · {a.keywords.slice(0, 3).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
