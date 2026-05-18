declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    rdt?: (...args: unknown[]) => void;
  }
}

export type AnalyticsSource = "demo" | "article" | "homepage" | "pick_teams" | "direct" | string;

export function trackEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

function trackRedditEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.rdt !== "function") return;
  if (params) {
    window.rdt("track", name, params);
    return;
  }
  window.rdt("track", name);
}

export function trackRedditSignUp(): void {
  trackRedditEvent("SignUp");
}

export function trackRedditLead(): void {
  trackRedditEvent("Lead");
}

/** First interaction with the no-login demo lineup builder. */
export function trackDemoContestStart(sport: string): void {
  trackEvent("demo_contest_start", { sport, engagement_type: "demo" });
}

/** User filled a valid demo roster within salary cap. */
export function trackDemoContestComplete(sport: string, projected_score: number): void {
  trackEvent("demo_contest_complete", { sport, projected_score, engagement_type: "demo" });
}

/** Clicked through to register after building a demo lineup. */
export function trackRegisterFromDemoClick(): void {
  trackEvent("register_from_demo_click", { source: "demo", engagement_type: "conversion" });
}

/** Successful account creation (mark as a Key event in GA4 admin). */
export function trackRegisterComplete(source: AnalyticsSource): void {
  trackEvent("register_complete", { source, engagement_type: "conversion" });
}

/** Authenticated pickleball pick / edit teams page opened. */
export function trackPickTeamsView(): void {
  trackEvent("pick_teams_view", { sport: "pickleball", engagement_type: "product" });
}

/** In-article or footer CTA toward signup or play flow. */
export function trackArticleCtaClick(article_slug: string, cta: "register" | "pick_teams" | "rankings" | "demo"): void {
  trackEvent("article_cta_click", { article_slug, cta, engagement_type: "conversion" });
}

export function trackGuestLineupSaved(sport: string, projected_score: number): void {
  trackEvent("guest_lineup_saved", { sport, projected_score, engagement_type: "conversion" });
}

export function trackBeatExpertsResult(
  sport: string,
  result: "win" | "tie" | "loss",
  user_score: number,
  expert_score: number,
): void {
  trackEvent("beat_experts_result", { sport, result, user_score, expert_score, engagement_type: "engagement" });
}

export function trackPlayInstantClick(source: string): void {
  trackEvent("play_instant_click", { source, engagement_type: "conversion" });
}

export function trackPublicLeaderboardView(sport: string): void {
  trackEvent("public_leaderboard_view", { sport, engagement_type: "product" });
}

export function trackLoginComplete(): void {
  trackEvent("login_complete", { engagement_type: "conversion" });
}

export function trackHowItWorksClick(source: string): void {
  trackEvent("how_it_works_click", { source, engagement_type: "engagement" });
}

/** Authenticated lineup saved to the server. */
export function trackLineupSaved(sport: string, tournament_key: string): void {
  trackEvent("lineup_saved", { sport, tournament_key, engagement_type: "conversion" });
}
