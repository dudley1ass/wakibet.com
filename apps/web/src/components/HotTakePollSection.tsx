import { useState } from "react";
import { Link } from "react-router-dom";
import RegisterPromptModal from "./RegisterPromptModal";

export type HotTakeItem = {
  id: string;
  text: string;
  agree: number;
  disagree: number;
};

function HotTakeCard({
  text,
  agreeStart,
  disagreeStart,
  onVoted,
}: {
  text: string;
  agreeStart: number;
  disagreeStart: number;
  onVoted: () => void;
}) {
  const [agree, setAgree] = useState(agreeStart);
  const [disagree, setDisagree] = useState(disagreeStart);
  const [vote, setVote] = useState<"agree" | "disagree" | null>(null);

  function pick(side: "agree" | "disagree") {
    if (vote === side) return;
    if (vote === "agree") setAgree((n) => n - 1);
    if (vote === "disagree") setDisagree((n) => n - 1);
    if (side === "agree") setAgree((n) => n + 1);
    else setDisagree((n) => n + 1);
    setVote(side);
    onVoted();
  }

  const total = agree + disagree;

  return (
    <article className="hot-take-card">
      <p className="hot-take-card__quote">&ldquo;{text}&rdquo;</p>
      <div className="hot-take-card__actions">
        <button type="button" className="hot-take-card__btn hot-take-card__btn--agree" onClick={() => pick("agree")}>
          Agree · {agree}
        </button>
        <button type="button" className="hot-take-card__btn hot-take-card__btn--disagree" onClick={() => pick("disagree")}>
          Disagree · {disagree}
        </button>
      </div>
      <div className="hot-take-card__meta">
        <span>{total} votes</span>
        <span className="hot-take-card__hint">Tap to vote</span>
      </div>
    </article>
  );
}

type Props = {
  hotTakes: HotTakeItem[];
  subtitle: string;
  featured?: boolean;
};

export default function HotTakePollSection({ hotTakes, subtitle, featured = false }: Props) {
  const [signupOpen, setSignupOpen] = useState(false);
  const featuredTake = hotTakes[0];
  const rest = hotTakes.slice(1);

  function handleVoted() {
    setSignupOpen(true);
  }

  if (!featuredTake) return null;

  return (
    <section
      className={`marketing-section marketing-section--hot${featured ? " marketing-section--hot-featured" : ""}`}
    >
      <RegisterPromptModal
        open={signupOpen}
        title="Track your sports knowledge"
        message="Create a free profile to save your vote and build lineups for this week's fantasy slates."
        registerFrom="hot_take_vote"
        onClose={() => setSignupOpen(false)}
      />
      <div className="marketing-section__head">
        <h2 className="marketing-section__title">Hot Takes</h2>
        <span className="marketing-section__subtitle">{subtitle}</span>
      </div>
      {featured ? (
        <div className="hot-take-featured">
          <HotTakeCard
            text={featuredTake.text}
            agreeStart={featuredTake.agree}
            disagreeStart={featuredTake.disagree}
            onVoted={handleVoted}
          />
        </div>
      ) : null}
      <div className="hot-take-scroller">
        {(featured ? rest : hotTakes).map((t) => (
          <HotTakeCard
            key={t.id}
            text={t.text}
            agreeStart={t.agree}
            disagreeStart={t.disagree}
            onVoted={handleVoted}
          />
        ))}
      </div>
      <p className="dash-sub hot-take-section__cta">
        <Link to="/auth?mode=register&from=hot_take">Create a free profile</Link> to track your accuracy over time.
      </p>
    </section>
  );
}
