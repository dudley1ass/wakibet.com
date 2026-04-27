import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "../../../api";
import type { NascarLineupPayload, NascarWeekRow } from "../lib/dashboardNascar";
import { nascarLineupComplete } from "../lib/dashboardNascar";
import {
  NASCAR_LINEUP_SIZE,
  NASCAR_LINEUP_WAKICASH_BUDGET,
  NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD,
  NASCAR_PREMIUM_WAKICASH_THRESHOLD,
} from "../lib/nascarLineupRules";

export type HubDriverRow = {
  driver_key: string;
  display_name: string;
  team_name: string | null;
  car_number: string | null;
  sponsor: string | null;
  manufacturer: string | null;
  waki_cash_price: number;
  is_elite: boolean;
};

type Props = {
  weekKey: string;
  week: NascarWeekRow;
  drivers: HubDriverRow[];
};

function isPremiumPrice(price: number): boolean {
  return price > NASCAR_PREMIUM_WAKICASH_THRESHOLD;
}

export default function NascarHubLineupPanel({ weekKey, week, drivers }: Props) {
  const qc = useQueryClient();
  const byKey = useMemo(() => new Map(drivers.map((d) => [d.driver_key, d])), [drivers]);

  const readOnly = week.status !== "upcoming";

  const lineupQ = useQuery<NascarLineupPayload>({
    queryKey: ["nascar", "lineup", weekKey] as const,
    queryFn: () => apiGet<NascarLineupPayload>(`/api/v1/nascar/lineup?week_key=${encodeURIComponent(weekKey)}`),
    enabled: Boolean(weekKey),
  });

  const [slots, setSlots] = useState<string[]>([]);
  const [captainKey, setCaptainKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = lineupQ.data;
    if (!data || data.week_key !== weekKey) return;
    const picks = [...data.picks].sort((a, b) => a.slot_index - b.slot_index);
    if (picks.length === 0) {
      setSlots([]);
      setCaptainKey(null);
      return;
    }
    setSlots(picks.map((p) => p.driver_key));
    setCaptainKey(picks.find((p) => p.is_captain)?.driver_key ?? null);
  }, [lineupQ.data, weekKey]);

  const spent = useMemo(() => {
    let t = 0;
    for (const k of slots) {
      const d = byKey.get(k);
      if (d) t += d.waki_cash_price;
    }
    return t;
  }, [slots, byKey]);

  const premiumCount = useMemo(() => {
    let n = 0;
    for (const k of slots) {
      const d = byKey.get(k);
      if (d && isPremiumPrice(d.waki_cash_price)) n += 1;
    }
    return n;
  }, [slots, byKey]);

  const addBlockReason = useCallback(
    (dk: string): string | null => {
      if (readOnly) return "This race is locked.";
      if (slots.includes(dk)) return "Already in lineup.";
      if (slots.length >= NASCAR_LINEUP_SIZE) return "Lineup is full.";
      const d = byKey.get(dk);
      if (!d) return "Unknown driver.";
      const next = [...slots, dk];
      let total = 0;
      let prem = 0;
      for (const k of next) {
        const dr = byKey.get(k);
        if (!dr) continue;
        total += dr.waki_cash_price;
        if (isPremiumPrice(dr.waki_cash_price)) prem += 1;
      }
      if (total > NASCAR_LINEUP_WAKICASH_BUDGET) return `Would exceed ${NASCAR_LINEUP_WAKICASH_BUDGET} WakiCash.`;
      if (prem > NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD) {
        return `At most ${NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD} drivers over ${NASCAR_PREMIUM_WAKICASH_THRESHOLD} WakiCash.`;
      }
      return null;
    },
    [slots, byKey, readOnly],
  );

  const removeSlot = (dk: string) => {
    setSlots((s) => s.filter((x) => x !== dk));
    setCaptainKey((c) => (c === dk ? null : c));
    setSaveError(null);
  };

  const addDriver = (dk: string) => {
    const err = addBlockReason(dk);
    if (err) {
      setSaveError(err);
      return;
    }
    setSlots((s) => [...s, dk]);
    setSaveError(null);
  };

  const toggleCaptain = (dk: string) => {
    if (!slots.includes(dk)) return;
    setCaptainKey((c) => (c === dk ? null : dk));
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (slots.length !== NASCAR_LINEUP_SIZE) {
      setSaveError(`Pick exactly ${NASCAR_LINEUP_SIZE} drivers.`);
      return;
    }
    if (!captainKey || !slots.includes(captainKey)) {
      setSaveError("Tap “Captain” on one driver in your lineup.");
      return;
    }
    const picks = slots.map((driver_key) => ({
      driver_key,
      is_captain: driver_key === captainKey,
    }));
    setSaving(true);
    try {
      await apiPut<NascarLineupPayload>("/api/v1/nascar/lineup", { week_key: weekKey, picks });
      await qc.invalidateQueries({ queryKey: ["nascar", "lineup", weekKey] });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save lineup.");
    } finally {
      setSaving(false);
    }
  };

  const complete = nascarLineupComplete(lineupQ.data, NASCAR_LINEUP_SIZE);

  return (
    <section className="nascar-lineup-panel" id="nascar-lineup-builder" aria-labelledby="nascar-lineup-title">
      <h2 id="nascar-lineup-title" className="dash-section-title">
        Your lineup — {week.race_name}
      </h2>
      <p className="dash-section-lead">
        Spent <strong>{spent}</strong> / {NASCAR_LINEUP_WAKICASH_BUDGET} WakiCash ·{" "}
        {`Premium (>${NASCAR_PREMIUM_WAKICASH_THRESHOLD}):`}{" "}
        <strong>
          {premiumCount}/{NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD}
        </strong>
        {readOnly ? (
          <>
            {" "}
            · <em>Editing closed for this race.</em>
          </>
        ) : null}
        {complete && lineupQ.data ? (
          <>
            {" "}
            · <span className="nascar-lineup-panel__saved">Saved lineup on file.</span>
          </>
        ) : null}
      </p>

      {lineupQ.isLoading ? (
        <p className="dash-empty">Loading lineup…</p>
      ) : lineupQ.isError ? (
        <p className="dash-error">Could not load your lineup for this week.</p>
      ) : (
        <>
          <div className="nascar-lineup-slots" role="list" aria-label="Driver slots">
            {Array.from({ length: NASCAR_LINEUP_SIZE }, (_, i) => {
              const dk = slots[i];
              const d = dk ? byKey.get(dk) : undefined;
              return (
                <div key={i} className="nascar-lineup-slot" role="listitem">
                  <div className="nascar-lineup-slot__idx">{i + 1}</div>
                  {d ? (
                    <div className="nascar-lineup-slot__body">
                      <div className="nascar-lineup-slot__name">{d.display_name}</div>
                      <div className="nascar-lineup-slot__meta">
                        #{d.car_number ?? "—"} · {d.waki_cash_price} WC
                        {isPremiumPrice(d.waki_cash_price) ? " · premium" : ""}
                      </div>
                      {!readOnly ? (
                        <div className="nascar-lineup-slot__actions">
                          <button
                            type="button"
                            className={`nascar-lineup-slot__cap${captainKey === dk ? " nascar-lineup-slot__cap--on" : ""}`}
                            onClick={() => toggleCaptain(dk)}
                            aria-pressed={captainKey === dk}
                          >
                            Captain
                          </button>
                          <button type="button" className="nascar-lineup-slot__rm" onClick={() => removeSlot(dk)}>
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="nascar-lineup-slot__empty">Open — add a driver below</div>
                  )}
                </div>
              );
            })}
          </div>

          {!readOnly ? (
            <div className="nascar-lineup-panel__save-row">
              <button type="button" className="dash-main-btn" onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Saving…" : "Save lineup"}
              </button>
              {saveError ? <p className="dash-error nascar-lineup-panel__err">{saveError}</p> : null}
            </div>
          ) : null}

          <h3 className="nascar-lineup-panel__pool-title">Add drivers</h3>
          <p className="dash-section-lead nascar-lineup-panel__pool-lead">
            {readOnly ? "Pool shown for reference." : "Tap a driver to add to the next open slot."}
          </p>
          <div className="nascar-lineup-driver-chips" aria-label="Driver pool">
            {drivers.map((d) => {
              const picked = slots.includes(d.driver_key);
              const block = picked ? "In lineup" : addBlockReason(d.driver_key);
              const disabled = readOnly || block != null;
              return (
                <button
                  key={d.driver_key}
                  type="button"
                  className={`nascar-lineup-chip${picked ? " nascar-lineup-chip--picked" : ""}${disabled && !picked ? " nascar-lineup-chip--disabled" : ""}`}
                  disabled={disabled}
                  onClick={() => addDriver(d.driver_key)}
                  title={block ?? `Add ${d.display_name}`}
                >
                  <span className="nascar-lineup-chip__name">{d.display_name}</span>
                  <span className="nascar-lineup-chip__price">{d.waki_cash_price} WC</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
