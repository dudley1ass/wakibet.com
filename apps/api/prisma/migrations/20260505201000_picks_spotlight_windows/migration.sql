-- Time-windowed "picks spotlight" copy per sport. Current window is resolved at read time (startsAt <= now < endsAt).

CREATE TABLE "PicksSpotlightWindow" (
    "id" TEXT NOT NULL,
    "sportKey" TEXT NOT NULL,
    "windowKey" TEXT NOT NULL,
    "labelShort" TEXT NOT NULL,
    "labelFull" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PicksSpotlightWindow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PicksSpotlightWindow_sportKey_windowKey_key" ON "PicksSpotlightWindow"("sportKey", "windowKey");
CREATE INDEX "PicksSpotlightWindow_sportKey_startsAt_idx" ON "PicksSpotlightWindow"("sportKey", "startsAt");

-- Seed: volleyball — advance by changing dates or inserting new rows per sport.
INSERT INTO "PicksSpotlightWindow" ("id","sportKey","windowKey","labelShort","labelFull","venue","href","startsAt","endsAt","createdAt","updatedAt") VALUES
('psw_vb_early2026','volleyball','avp_early_2026','Volleyball','Volleyball Picks','AVP winter stops','/volleyball-picks',TIMESTAMP '2026-01-01 00:00:00',TIMESTAMP '2026-03-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('psw_vb_spring2026','volleyball','hb_open_spring_2026','Volleyball','Volleyball Picks','Huntington Beach Open','/volleyball-picks',TIMESTAMP '2026-03-01 00:00:00',TIMESTAMP '2026-07-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('psw_vb_late2026','volleyball','avp_late_2026','Volleyball','Volleyball Picks','AVP summer swing','/volleyball-picks',TIMESTAMP '2026-07-01 00:00:00',TIMESTAMP '2027-01-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "PicksSpotlightWindow" ("id","sportKey","windowKey","labelShort","labelFull","venue","href","startsAt","endsAt","createdAt","updatedAt") VALUES
('psw_pb_early2026','pickleball','mlp_pre_dallas','Pickleball','Pickleball Picks','MLP season kickoff','/week-picks',TIMESTAMP '2026-01-01 00:00:00',TIMESTAMP '2026-04-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('psw_pb_dallas2026','pickleball','mlp_dallas_2026','Pickleball','Pickleball Picks','MLP Dallas 2026','/week-picks',TIMESTAMP '2026-04-01 00:00:00',TIMESTAMP '2026-07-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('psw_pb_late2026','pickleball','mlp_next_2026','Pickleball','Pickleball Picks','Next MLP stop','/week-picks',TIMESTAMP '2026-07-01 00:00:00',TIMESTAMP '2027-01-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "PicksSpotlightWindow" ("id","sportKey","windowKey","labelShort","labelFull","venue","href","startsAt","endsAt","createdAt","updatedAt") VALUES
('psw_lax_early2026','lacrosse','pll_early_2026','Lacrosse','Lacrosse Slate','PLL early season','/lacrosse',TIMESTAMP '2026-01-01 00:00:00',TIMESTAMP '2026-05-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('psw_lax_utah2026','lacrosse','utah_open_2026','Lacrosse','Lacrosse Slate','Utah Open · PLL','/lacrosse',TIMESTAMP '2026-05-01 00:00:00',TIMESTAMP '2026-09-15 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('psw_lax_playoffs2026','lacrosse','pll_late_2026','Lacrosse','Lacrosse Slate','PLL stretch run','/lacrosse',TIMESTAMP '2026-09-15 00:00:00',TIMESTAMP '2027-01-01 00:00:00',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
