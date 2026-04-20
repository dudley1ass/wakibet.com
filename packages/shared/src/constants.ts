/** Virtual currency — design for future `USD` swap via config. */
export const CURRENCY_DILLS = "DILLS" as const;

export const SIGNUP_BONUS_DILLS = 10_000;
export const DAILY_LOGIN_BONUS_DILLS = 500;
export const REFERRAL_FIRST_CONTEST_BONUS_DILLS = 2_500;

export const ENTRY_FEE_TIERS_DILLS = [100, 500, 1_000, 5_000] as const;

/** Default contest rake (10%) — matches spec teaching rake without real money. */
export const DEFAULT_RAKE_PCT = 10;
