import json
import re
from collections import defaultdict
from pathlib import Path


MONTHS = {
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
}


def is_date_line(s: str) -> bool:
    parts = s.split()
    return len(parts) == 3 and parts[0] in MONTHS and parts[1].isdigit() and parts[2].isdigit()


def is_status_line(s: str) -> bool:
    return "Waiting to Start" in s or "In Progress" in s or "Completed" in s


def parse_event_label(label: str) -> tuple[str, str, str]:
    label = label.strip()
    m = re.match(r"^(.*?)\s+Skill:\s+\((.*?)\)\s+Age:\s+\((.*?)\)\s*$", label)
    if m:
        return m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
    return label, "Open", "All"


def short_slug(text: str) -> str:
    s = "".join(ch for ch in text.upper() if ch.isalnum())
    return (s[:8] if s else "DIV")


def main() -> None:
    api_root = Path(__file__).resolve().parent.parent
    data_dir = api_root / "data"
    raw_path = data_dir / "atlanta_players_raw.txt"
    out_json = data_dir / "atlanta_weekend_test_run_matches.json"
    out_summary = data_dir / "atlanta_weekend_test_run_summary.json"

    if not raw_path.exists():
        raise FileNotFoundError(f"Missing input: {raw_path}")

    lines = [ln.strip() for ln in raw_path.read_text(encoding="utf-8", errors="ignore").splitlines()]

    player_event_rows: list[dict[str, str]] = []
    current_player = ""
    in_events = False
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            i += 1
            continue

        if line.startswith("</user_query>"):
            break

        # Player header: "Last, First" and nearby "Gender:" line.
        if "," in line and not line.startswith("http"):
            if any((i + j) < len(lines) and lines[i + j].startswith("Gender:") for j in (1, 2, 3, 4)):
                current_player = line
                in_events = False
                i += 1
                continue

        if line.startswith("Events Registered"):
            in_events = bool(current_player)
            i += 1
            continue

        if not in_events:
            i += 1
            continue

        if line in {"Details", "Draw", "Waiting List", "Send partner request"}:
            i += 1
            continue

        # Expect event line then date line then status line.
        event_line = line
        j = i + 1
        if j >= len(lines) or not is_date_line(lines[j]):
            i += 1
            continue
        date_line = lines[j]
        j += 1
        if j >= len(lines) or not is_status_line(lines[j]):
            i += 1
            continue
        status_line = lines[j]
        j += 1

        partner = ""
        if j < len(lines):
            nxt = lines[j]
            if nxt and nxt not in {"Details", "Draw", "Waiting List", "Send partner request"} and "," in nxt:
                partner = nxt
                j += 1

        # Skip trailing marker lines.
        while j < len(lines) and lines[j] in {"Details", "Draw", "Waiting List", "Send partner request"}:
            j += 1

        player_event_rows.append(
            {
                "player_name": current_player,
                "event_label": event_line,
                "event_date": date_line,
                "status": status_line.replace("â€¢", "").replace("•", "").strip(),
                "partner": partner,
            }
        )
        i = j

    divisions: dict[tuple[str, str, str, str], set[str]] = defaultdict(set)
    for row in player_event_rows:
        event_type, skill_level, age_bracket = parse_event_label(row["event_label"])
        key = (event_type, skill_level, age_bracket, row["event_date"])
        divisions[key].add(row["player_name"])
        if row["partner"]:
            divisions[key].add(row["partner"])

    matches: list[dict[str, str]] = []
    per_player_matches: dict[str, list[dict[str, str]]] = defaultdict(list)
    for event_type, skill_level, age_bracket, event_date in sorted(divisions.keys()):
        players = sorted(divisions[(event_type, skill_level, age_bracket, event_date)])
        if len(players) < 2:
            continue
        base = f"{short_slug(event_type)}-{short_slug(event_date)}"
        match_num = 1

        # Lightweight synthetic schedule (O(n) per division) just to power lineup pools.
        pairs: list[tuple[str, str]] = []
        for idx in range(0, len(players) - 1, 2):
            pairs.append((players[idx], players[idx + 1]))
        if len(players) % 2 == 1:
            pairs.append((players[-1], players[0]))

        for p1, p2 in pairs:
            match_id = f"{base}-{match_num}"
            match_num += 1
            matches.append(
                {
                    "match_id": match_id,
                    "event_type": event_type,
                    "skill_level": skill_level,
                    "age_bracket": age_bracket,
                    "event_date": event_date,
                    "player_a": p1,
                    "player_b": p2,
                    "status": "scheduled",
                }
            )
            per_player_matches[p1].append(
                {
                    "match_id": match_id,
                    "event_type": event_type,
                    "skill_level": skill_level,
                    "age_bracket": age_bracket,
                    "event_date": event_date,
                    "opponent": p2,
                }
            )
            per_player_matches[p2].append(
                {
                    "match_id": match_id,
                    "event_type": event_type,
                    "skill_level": skill_level,
                    "age_bracket": age_bracket,
                    "event_date": event_date,
                    "opponent": p1,
                }
            )

    payload = {
        "summary": {
            "tournament_name": "PPA Tour: 2026 Veolia Atlanta Pickleball Championships (test run)",
            "source_file": str(raw_path),
            "player_event_rows_parsed": len(player_event_rows),
            "players_with_generated_matches": len(per_player_matches),
            "divisions_considered": len(divisions),
            "matches_generated": len(matches),
            "generation_mode": "synthetic_pairs_per_division_from_players_page",
        },
        "matches": matches,
        "per_player_matches": dict(sorted(per_player_matches.items())),
    }

    out_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    out_summary.write_text(json.dumps(payload["summary"], indent=2), encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2))
    print(f"Wrote: {out_json}")
    print(f"Wrote: {out_summary}")


if __name__ == "__main__":
    main()
