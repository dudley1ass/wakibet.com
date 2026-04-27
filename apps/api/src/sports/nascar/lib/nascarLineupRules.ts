/** Weekly NASCAR lineup constraints (match published scoring / product copy). */
export const NASCAR_LINEUP_WAKICASH_BUDGET = 100;
/** Drivers with salary **strictly greater** than this count toward the premium cap. */
export const NASCAR_PREMIUM_WAKICASH_THRESHOLD = 30;
/** Max drivers over `NASCAR_PREMIUM_WAKICASH_THRESHOLD` per lineup (reduces elite stacking). */
export const NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD = 2;
export const NASCAR_LINEUP_SIZE = 5;

/** @deprecated Prefer `NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD` + salary threshold (same value: 2). */
export const NASCAR_LINEUP_MAX_ELITE = NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD;
