import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";
import { trackEvent } from "../lib/analytics";

type ReactionType = "HOT_TAKE" | "TERRIBLE_TAKE" | "SHARP" | "SLEEPER";
type PollOption = "OVERRATED" | "FAIR_VALUE" | "SLEEPER";

type EngagementPayload = {
  article_slug: string;
  poll: {
    question: string;
    options: { option: PollOption; label: string; votes: number; pct: number }[];
  };
  reactions: { reaction_type: ReactionType; label: string; votes: number }[];
  my_reaction: ReactionType | null;
  my_poll_option: PollOption | null;
};

const ANON_STORAGE_KEY = "wakibet_article_anon_id_v1";

function getOrCreateAnonId(): string {
  const existing = localStorage.getItem(ANON_STORAGE_KEY);
  if (existing && existing.length >= 8) return existing;
  const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem(ANON_STORAGE_KEY, next);
  return next;
}

export default function ArticleEngagementCard({ slug }: { slug: string }) {
  const [data, setData] = useState<EngagementPayload | null>(null);
  const [busy, setBusy] = useState<"" | "reaction" | "poll">("");
  const anonId = useMemo(() => getOrCreateAnonId(), []);
  const headers = useMemo(() => ({ "x-wakibet-anon-id": anonId }), [anonId]);

  useEffect(() => {
    let mounted = true;
    apiGet<EngagementPayload>(`/api/v1/articles/${slug}/engagement`, { headers })
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch(() => {
        // Keep article readable even if engagement API is down.
      });
    return () => {
      mounted = false;
    };
  }, [slug, headers]);

  if (!data) return null;

  async function saveReaction(next: ReactionType) {
    setBusy("reaction");
    try {
      await apiPost(`/api/v1/articles/${slug}/reaction`, {
        reaction_type: next,
        anon_id: anonId,
      });
      const refreshed = await apiGet<EngagementPayload>(`/api/v1/articles/${slug}/engagement`, { headers });
      setData(refreshed);
      trackEvent("reaction_added", { article_slug: slug, reaction_type: next });
    } finally {
      setBusy("");
    }
  }

  async function savePollVote(next: PollOption) {
    setBusy("poll");
    try {
      await apiPost(`/api/v1/articles/${slug}/poll-vote`, {
        option: next,
        anon_id: anonId,
      });
      const refreshed = await apiGet<EngagementPayload>(`/api/v1/articles/${slug}/engagement`, { headers });
      setData(refreshed);
      trackEvent("poll_voted", { article_slug: slug, poll_option: next });
    } finally {
      setBusy("");
    }
  }

  return (
    <section style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.25)" }}>
      <p className="dash-sub" style={{ marginTop: 0 }}>
        React and vote
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {data.reactions.map((r) => (
          <button
            key={r.reaction_type}
            type="button"
            className={data.my_reaction === r.reaction_type ? "dash-btn" : "dash-ghost-btn"}
            onClick={() => void saveReaction(r.reaction_type)}
            disabled={busy !== ""}
          >
            {r.label} · {r.votes}
          </button>
        ))}
      </div>

      <p className="dash-sub" style={{ marginBottom: 8 }}>
        {data.poll.question}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {data.poll.options.map((o) => (
          <button
            key={o.option}
            type="button"
            className={data.my_poll_option === o.option ? "dash-btn" : "dash-ghost-btn"}
            onClick={() => void savePollVote(o.option)}
            disabled={busy !== ""}
            style={{ textAlign: "left", justifyContent: "space-between" }}
          >
            <span>{o.label}</span>
            <span>
              {o.pct}% ({o.votes})
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
