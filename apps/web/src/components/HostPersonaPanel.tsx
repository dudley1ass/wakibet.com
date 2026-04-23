import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionUser } from "../App";
import { useDashboardDataRequired } from "../context/DashboardDataContext";
import {
  FeedSessionState,
  buildCandidateMessages,
  buildFeedContext,
  markWelcomeShown,
  randomBetween,
  ttlMsForPriority,
  type FeedMessage,
  type FeedMessageLive,
} from "./feed";
import "./host-persona.css";

type Props = {
  user: SessionUser;
  path: string;
  layout: "inline" | "floating";
};

function toLive(m: FeedMessage): FeedMessageLive {
  return { ...m, _expiresAtMs: Date.now() + ttlMsForPriority(m.priority) };
}

function iconForType(t: FeedMessage["type"]): string {
  switch (t) {
    case "WELCOME":
      return "👋";
    case "LOCK_WARNING":
      return "⏳";
    case "RANK_UP":
      return "🚀";
    case "RANK_DOWN":
      return "📉";
    case "PROJECTION":
      return "🎯";
    case "RESULT_UPDATE":
      return "⚡";
    case "HOT_STREAK":
      return "🔥";
    case "PICK_PRAISE":
    case "VALUE_PICK":
      return "💡";
    case "OPEN_SLOT":
      return "✏️";
    case "SYSTEM_HINT":
    default:
      return "ℹ️";
  }
}

export default function HostPersonaPanel({ user, path, layout }: Props) {
  const dash = useDashboardDataRequired();
  const preview = dash.preview;
  const pulse = preview?.fantasy_pulse ?? null;
  const [open, setOpen] = useState(true);
  const [feed, setFeed] = useState<FeedMessageLive[]>([]);
  const feedBoxRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const sessionRef = useRef(new FeedSessionState());

  useEffect(() => {
    setOpen(true);
  }, [path]);

  useEffect(() => {
    sessionRef.current.reset();
  }, [user.user_id]);

  useLayoutEffect(() => {
    if (feedBoxRef.current) feedBoxRef.current.scrollTop = 0;
  }, [feed]);

  useEffect(() => {
    if (!open) return;

    const clearAll = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
    clearAll();
    setFeed([]);

    let alive = true;
    let tickCount = 0;
    const session = sessionRef.current;

    const pushOne = (m: FeedMessage) => {
      if (!alive) return;
      if (m.type === "WELCOME") {
        markWelcomeShown(user.user_id);
      }
      session.recordShown(m);
      const live = toLive(m);
      setFeed((prev) => [live, ...prev].slice(0, 3));
      const rm = window.setTimeout(() => {
        if (!alive) return;
        setFeed((prev) => prev.filter((x) => x.id !== live.id));
      }, live._expiresAtMs - Date.now());
      timersRef.current.push(rm);
    };

    const pullNext = (): FeedMessage | null => {
      const ctx = buildFeedContext(user, path, preview, pulse);
      const raw = buildCandidateMessages(ctx);
      let fresh = session.filterFresh(raw);
      if (fresh.length === 0) {
        session.clearSoft();
        fresh = session.filterFresh(raw);
      }
      return fresh[0] ?? null;
    };

    const schedulePump = () => {
      const delay =
        tickCount === 0
          ? randomBetween(1000, 2200)
          : tickCount === 1
            ? randomBetween(6000, 10_000)
            : randomBetween(20_000, 45_000);
      tickCount += 1;

      const tid = window.setTimeout(() => {
        if (!alive) return;
        const next = pullNext();
        if (next) pushOne(next);
        schedulePump();
      }, delay);
      timersRef.current.push(tid);
    };

    schedulePump();

    return () => {
      alive = false;
      clearAll();
    };
  }, [open, user, path, preview, pulse]);

  const rootClass = layout === "inline" ? "hp-root hp-root--inline" : "hp-root";

  return (
    <div className={rootClass} aria-label="Activity feed">
      <button type="button" className="hp-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="hp-avatar" aria-hidden>
          ☺
        </span>
        <span>{open ? "Hide feed" : "Live feed"}</span>
      </button>
      {open ? (
        <div className="hp-panel" role="log" aria-live="polite" aria-relevant="additions text">
          <div className="hp-title">Activity</div>
          <div className="hp-feed" ref={feedBoxRef}>
            {feed.length === 0 ? <div className="hp-feed-empty">Warming up the ticker…</div> : null}
            {feed.map((m) => (
              <div
                key={m.id}
                className={`hp-feed-line hp-feed-line--p-${m.priority}`}
              >
                <span className="hp-feed-icon" aria-hidden>
                  {iconForType(m.type)}
                </span>
                <span className="hp-feed-text">{m.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
