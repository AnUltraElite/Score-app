import { useState, useEffect, useRef } from "react";
import {
  Home, Trophy, PlusCircle, User, Search, ChevronLeft, Lock, Globe,
  Flame, X, Users, Settings, Bell, Shield, Moon, ChevronRight,
  LogOut, HelpCircle, Star, UserPlus, Undo2, Award,
  Clock, Calendar, Zap, Check, Coins, ChevronDown, Grid3x3,
} from "lucide-react";

// ============================================================
// DESIGN TOKENS
// ============================================================
const SPORT_COLOR = {
  soccer: "#3DDC97",
  cricket: "#FFB800",
  badminton: "#4EC5FF",
  volleyball: "#B98BFF",
};
const SPORT_ICON = { soccer: "⚽", cricket: "🏏", badminton: "🏸", volleyball: "🏐" };

// ============================================================
// SEED DATA
// ============================================================
const seedMatches = [
  {
    id: "m1", sport: "soccer", status: "live", visibility: "public",
    a: { name: "Riverside FC", short: "RIV", score: 2 },
    b: { name: "Ashford United", short: "ASH", score: 1 },
    minute: 67, detail: "2nd Half",
    events: [
      { min: 12, type: "goal", team: "a", player: "J. Ortiz" },
      { min: 34, type: "yellow", team: "b", player: "D. Cole" },
      { min: 41, type: "goal", team: "b", player: "M. Finch" },
      { min: 58, type: "goal", team: "a", player: "R. Vance" },
    ],
    players: { a: ["J. Ortiz", "R. Vance", "T. Brady", "S. Lopez"], b: ["M. Finch", "D. Cole", "K. Ng", "P. Silva"] },
    captains: { a: "J. Ortiz", b: "M. Finch" },
  },
  {
    id: "m2", sport: "cricket", status: "live", visibility: "public",
    a: { name: "Delta Strikers", short: "DEL", score: "142/4", overs: "16.2", runs: 142, wickets: 4, ballsBowled: 98 },
    b: { name: "Coastal XI", short: "COA", score: "—", overs: "" },
    minute: null, detail: "Delta Strikers batting · 1st Innings",
    // over history: array of overs, each an array of ball outcomes
    overHistory: [
      [1, 4, 0, 1, 2, 0], [0, 0, 6, 1, 0, "W"], [4, 4, 1, 0, 0, 1],
    ],
    balls: [1, 4, 0, "W", 2, 6],
    striker: "A. Kade", nonStriker: "V. Rana", bowler: "T. Okafor",
    players: { a: ["A. Kade", "V. Rana", "S. Bhatt", "L. Marsh"], b: ["T. Okafor", "R. Singh", "C. Botha", "F. Zaman"] },
    captains: { a: "A. Kade", b: "T. Okafor" },
    dismissed: ["S. Bhatt"],
    toss: { winner: "a", decision: "bat" },
  },
  {
    id: "m3", sport: "badminton", status: "live", visibility: "private",
    a: { name: "N. Rao", short: "RAO", score: 21, sets: [21, 18] },
    b: { name: "K. Meyer", short: "MEY", score: 18, sets: [15, 21] },
    minute: null, detail: "Game 3 · Decider",
    players: { a: ["N. Rao"], b: ["K. Meyer"] },
  },
  {
    id: "m4", sport: "volleyball", status: "scheduled", visibility: "public",
    a: { name: "Sunset Spikers", short: "SUN", score: 0 },
    b: { name: "Northgate", short: "NOR", score: 0 },
    minute: null, detail: "Today, 7:30 PM", scheduledAt: "Today, 7:30 PM",
    players: { a: [], b: [] },
  },
  {
    id: "m5", sport: "soccer", status: "final", visibility: "public",
    a: { name: "Harbor City", short: "HAR", score: 3 },
    b: { name: "Elm Rangers", short: "ELM", score: 3 },
    minute: null, detail: "Full Time",
    players: { a: [], b: [] },
  },
  {
    id: "m6", sport: "cricket", status: "scheduled", visibility: "public",
    a: { name: "Northside CC", short: "NOR", score: "—" },
    b: { name: "Valley Titans", short: "VAL", score: "—" },
    minute: null, detail: "Tomorrow, 9:00 AM", scheduledAt: "Tomorrow, 9:00 AM",
    players: { a: [], b: [] },
  },
  {
    id: "m7", sport: "badminton", status: "scheduled", visibility: "private",
    a: { name: "Priya S.", short: "PRI", score: 0 },
    b: { name: "J. Wexler", short: "WEX", score: 0 },
    minute: null, detail: "Fri, 6:00 PM", scheduledAt: "Fri, 6:00 PM",
    players: { a: [], b: [] },
  },
];

// ============================================================
// LIQUID GLASS PRIMITIVES
// ============================================================
function Glass({ children, style, onClick, className, tint }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: "relative",
        background: tint
          ? `linear-gradient(155deg, ${tint}14, rgba(255,255,255,0.03) 60%)`
          : "linear-gradient(155deg, rgba(255,255,255,0.065), rgba(255,255,255,0.018) 60%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px -12px rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderRadius: 20, ...style,
      }}
    >
      {children}
    </div>
  );
}

function LiquidGlassShell({ children, style }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.05))",
      backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.04), 0 -8px 32px -8px rgba(0,0,0,0.45)",
      overflow: "hidden", ...style,
    }}>
      <div className="liquid-sheen" />
      {children}
    </div>
  );
}

function LivePill({ small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(255,70,85,0.12)", border: "1px solid rgba(255,70,85,0.35)",
      color: "#FF6B78", borderRadius: 999, padding: small ? "3px 8px" : "4px 10px",
      fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.04em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "#FF4655", animation: "pulseDot 1.4s infinite" }} />
      LIVE
    </span>
  );
}

// ============================================================
// FLIP NUMBER
// ============================================================
function FlipNumber({ value, size = 56, color = "#fff" }) {
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      setFlipping(true);
      const t = setTimeout(() => { setDisplay(value); setFlipping(false); }, 220);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span style={{
      display: "inline-block", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
      fontSize: size, color, lineHeight: 1,
      transform: flipping ? "translateY(-14%) scale(0.9)" : "translateY(0) scale(1)",
      opacity: flipping ? 0.3 : 1,
      transition: "transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.22s ease",
      letterSpacing: "-0.02em",
    }}>{display}</span>
  );
}

// ============================================================
// MATCH / UPCOMING CARDS
// ============================================================
function MatchCard({ m, onOpen }) {
  const color = SPORT_COLOR[m.sport];
  const isLive = m.status === "live";
  return (
    <Glass onClick={() => onOpen(m)} style={{ padding: 16, cursor: "pointer", position: "relative", overflow: "hidden", marginBottom: 12 }} className="match-card">
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color, opacity: isLive ? 1 : 0.3 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{SPORT_ICON[m.sport]}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "capitalize" }}>{m.sport}</span>
          {m.visibility === "private" && <Lock size={11} color="rgba(255,255,255,0.35)" />}
        </div>
        {isLive ? <LivePill small /> : (
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{m.status === "final" ? "FT" : "UPCOMING"}</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <Row team={m.a} highlight={isLive} />
        <Row team={m.b} highlight={isLive} />
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{m.detail}{m.minute ? ` · ${m.minute}'` : ""}</div>
    </Glass>
  );
}

function Row({ team, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.7)", fontFamily: "Space Grotesk" }}>{team.short}</div>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{team.name}</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Space Grotesk", color: highlight ? "#fff" : "rgba(255,255,255,0.5)" }}>
        {team.score}{team.overs ? <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}> ({team.overs})</span> : ""}
      </span>
    </div>
  );
}

function UpcomingCard({ m, onOpen }) {
  const color = SPORT_COLOR[m.sport];
  return (
    <Glass onClick={() => onOpen(m)} tint={color} style={{ padding: 14, cursor: "pointer", marginBottom: 10 }} className="match-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}1c`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{SPORT_ICON[m.sport]}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{m.a.name} <span style={{ color: "rgba(255,255,255,0.35)" }}>vs</span> {m.b.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><Clock size={10} /> {m.scheduledAt || m.detail}</div>
          </div>
        </div>
        {m.visibility === "private" ? <Lock size={12} color="rgba(255,255,255,0.3)" /> : <Globe size={12} color="rgba(255,255,255,0.3)" />}
      </div>
    </Glass>
  );
}

// ============================================================
// MATCH DETAIL ROUTER
// ============================================================
function MatchDetail({ m, onBack, onUpdate }) {
  const color = SPORT_COLOR[m.sport];
  const [visibility, setVisibility] = useState(m.visibility);

  return (
    <div style={{ animation: "slideUp 0.35s cubic-bezier(.16,1,.3,1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onBack} style={ghostBtn} className="press"><ChevronLeft size={18} /> <span style={{ fontSize: 14 }}>Back</span></button>
        <button
          onClick={() => setVisibility(v => v === "public" ? "private" : "public")}
          className="press"
          style={{ ...ghostBtn, border: `1px solid ${visibility === "public" ? "rgba(61,220,151,0.4)" : "rgba(255,255,255,0.12)"}`, color: visibility === "public" ? "#3DDC97" : "rgba(255,255,255,0.6)" }}
        >
          {visibility === "public" ? <Globe size={14} /> : <Lock size={14} />}
          <span style={{ fontSize: 12.5, fontWeight: 600, textTransform: "capitalize" }}>{visibility}</span>
        </button>
      </div>

      {m.sport === "cricket" ? (
        <CricketScorer m={m} color={color} visibility={visibility} onUpdate={onUpdate} />
      ) : m.sport === "soccer" ? (
        <SoccerScorer m={m} color={color} visibility={visibility} onUpdate={onUpdate} />
      ) : (
        <GenericScorer m={m} color={color} visibility={visibility} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// ---------- Generic (badminton / volleyball) ----------
function GenericScorer({ m, color, visibility, onUpdate }) {
  const [showRoster, setShowRoster] = useState(false);
  const bump = (side, delta) => {
    onUpdate(m.id, (draft) => {
      if (typeof draft[side].score === "number") draft[side].score = Math.max(0, draft[side].score + delta);
    });
  };

  return (
    <>
      <Glass style={{ padding: "28px 20px", position: "relative", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none", background: `radial-gradient(circle at 50% -10%, ${color}, transparent 60%)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
          <div>{m.status === "live" ? <LivePill /> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{m.detail}</span>}</div>
          <button onClick={() => setShowRoster(true)} className="press" style={{ ...ghostBtn, padding: "5px 10px" }}><Users size={13} /><span style={{ fontSize: 11.5 }}>Squads</span></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <TeamBlock team={m.a} color={color} onPlus={() => bump("a", 1)} onMinus={() => bump("a", -1)} />
          <div style={{ fontFamily: "Space Grotesk", fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 700, padding: "0 8px" }}>VS</div>
          <TeamBlock team={m.b} color={color} onPlus={() => bump("b", 1)} onMinus={() => bump("b", -1)} />
        </div>
      </Glass>

      {(m.a.sets || []).length > 0 && (
        <Glass style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Set history</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(m.a.sets || []).map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
                <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 15, color: "#fff" }}>{s}–{m.b.sets[i]}</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>SET {i + 1}</div>
              </div>
            ))}
          </div>
        </Glass>
      )}

      <Glass style={{ padding: 16 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Scorer controls</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Tap the + / − under each team to update live. Changes reflect instantly for every viewer{visibility === "private" ? " with the invite link." : "."}</div>
      </Glass>

      {showRoster && <RosterModal m={m} onClose={() => setShowRoster(false)} />}
    </>
  );
}

function TeamBlock({ team, color, onPlus, onMinus }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: "rgba(255,255,255,0.75)" }}>{team.short}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 500 }}>{team.name}</div>
      <FlipNumber value={team.score} size={44} />
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
        <button onClick={onMinus} style={scoreBtn} className="press">−</button>
        <button onClick={onPlus} style={{ ...scoreBtn, background: color, color: "#0A0E12", borderColor: color }} className="press">+</button>
      </div>
    </div>
  );
}

// ============================================================
// CRICKET SCORER — full rework
// ============================================================
function CricketScorer({ m, color, visibility, onUpdate }) {
  const [showOvers, setShowOvers] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [pickerRole, setPickerRole] = useState(null); // 'striker' | 'nonStriker' | 'bowler'

  const currentOver = m.balls || [];
  const overHistory = m.overHistory || [];
  const battingSquad = (m.players?.a) || [];
  const bowlingSquad = (m.players?.b) || [];
  const dismissed = m.dismissed || [];
  const onStrikeNames = [m.striker, m.nonStriker].filter(Boolean);
  const yetToBat = battingSquad.filter(p => !dismissed.includes(p) && !onStrikeNames.includes(p));

  const commitBall = (val, extraLabel) => {
    onUpdate(m.id, (draft) => {
      if (!draft.balls) draft.balls = [];
      if (!draft.overHistory) draft.overHistory = [];
      draft.balls = [...draft.balls, val];

      const isLegal = val !== "Wd" && val !== "Nb";
      const runsFromVal = val === "W" ? 0 : (val === "Wd" || val === "Nb") ? 1 : Number(val);
      draft.a.runs = (draft.a.runs || 0) + runsFromVal;
      if (val === "W") draft.a.wickets = (draft.a.wickets || 0) + 1;
      if (isLegal) draft.a.ballsBowled = (draft.a.ballsBowled || 0) + 1;

      const overs = Math.floor((draft.a.ballsBowled || 0) / 6);
      const ballsInOver = (draft.a.ballsBowled || 0) % 6;
      draft.a.overs = `${overs}.${ballsInOver}`;
      draft.a.score = `${draft.a.runs}/${draft.a.wickets || 0}`;

      // roll over into history once 6 legal balls are in
      if (isLegal && draft.balls.length === 6) {
        draft.overHistory = [...draft.overHistory, draft.balls];
        draft.balls = [];
      }
    });
  };

  const undoBall = () => {
    onUpdate(m.id, (draft) => {
      let balls = draft.balls || [];
      if (balls.length === 0 && (draft.overHistory || []).length > 0) {
        // pull last over back for editing
        balls = draft.overHistory[draft.overHistory.length - 1];
        draft.overHistory = draft.overHistory.slice(0, -1);
      }
      if (balls.length === 0) return;
      const last = balls[balls.length - 1];
      draft.balls = balls.slice(0, -1);
      const isLegal = last !== "Wd" && last !== "Nb";
      const runsFromVal = last === "W" ? 0 : (last === "Wd" || last === "Nb") ? 1 : Number(last);
      draft.a.runs = Math.max(0, (draft.a.runs || 0) - runsFromVal);
      if (last === "W") draft.a.wickets = Math.max(0, (draft.a.wickets || 0) - 1);
      if (isLegal) draft.a.ballsBowled = Math.max(0, (draft.a.ballsBowled || 0) - 1);
      const overs = Math.floor((draft.a.ballsBowled || 0) / 6);
      const ballsInOver = (draft.a.ballsBowled || 0) % 6;
      draft.a.overs = `${overs}.${ballsInOver}`;
      draft.a.score = `${draft.a.runs}/${draft.a.wickets || 0}`;
    });
  };

  const setPlayer = (role, name) => {
    onUpdate(m.id, (draft) => { draft[role] = name; });
    setPickerRole(null);
  };

  const dismissStriker = () => {
    onUpdate(m.id, (draft) => {
      if (!draft.dismissed) draft.dismissed = [];
      if (draft.striker) draft.dismissed = [...draft.dismissed, draft.striker];
      draft.striker = null;
    });
  };

  const ballChipStyle = (v) => {
    if (v === "W") return { bg: "rgba(255,70,85,0.14)", fg: "#FF6B78", bd: "rgba(255,70,85,0.4)" };
    if (v === 4 || v === 6) return { bg: "rgba(255,184,0,0.14)", fg: "#FFC933", bd: "rgba(255,184,0,0.4)" };
    if (v === "Wd" || v === "Nb") return { bg: "rgba(78,197,255,0.12)", fg: "#4EC5FF", bd: "rgba(78,197,255,0.35)" };
    return { bg: "rgba(255,255,255,0.06)", fg: "#fff", bd: "rgba(255,255,255,0.12)" };
  };

  const overRuns = (over) => over.reduce((sum, b) => {
    if (b === "W") return sum;
    if (b === "Wd" || b === "Nb") return sum + 1;
    return sum + Number(b);
  }, 0);

  return (
    <div className="cricket-shell">
      {/* Compact hero scoreboard */}
      <Glass style={{ padding: "16px 16px 14px", position: "relative", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.14, pointerEvents: "none", background: `radial-gradient(circle at 50% -10%, ${color}, transparent 60%)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, position: "relative" }}>
          {m.status === "live" ? <LivePill small /> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{m.detail}</span>}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowPlayers(true)} className="press" style={{ ...ghostBtn, padding: "5px 9px" }}><Users size={12} /><span style={{ fontSize: 11 }}>Players</span></button>
            <button onClick={() => setShowOvers(true)} className="press" style={{ ...ghostBtn, padding: "5px 9px" }}><Grid3x3 size={12} /><span style={{ fontSize: 11 }}>Overs</span></button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", position: "relative" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 2 }}>{m.a.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <FlipNumber value={m.a.runs ?? 0} size={38} color={color} />
              <span style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>/{m.a.wickets ?? 0}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{m.a.overs || "0.0"} ov</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>vs {m.b.name}</div>
          </div>
        </div>
      </Glass>

      {/* Striker / non-striker / bowler selectors */}
      <Glass style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <PlayerSlot label="STRIKER" value={m.striker} onClick={() => setPickerRole("striker")} accent={color} highlight />
          <PlayerSlot label="NON-STRIKER" value={m.nonStriker} onClick={() => setPickerRole("nonStriker")} accent={color} />
          <PlayerSlot label="BOWLER" value={m.bowler} onClick={() => setPickerRole("bowler")} accent="#4EC5FF" />
        </div>
      </Glass>

      {/* This over strip */}
      <Glass style={{ padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.03em" }}>THIS OVER</span>
          <button onClick={undoBall} className="press" style={{ ...ghostBtn, padding: "4px 9px" }}><Undo2 size={11} /><span style={{ fontSize: 10.5 }}>Undo</span></button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 26 }}>
          {currentOver.length === 0 && <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>New over</span>}
          {currentOver.map((b, i) => {
            const c = ballChipStyle(b);
            return <div key={i} style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, fontSize: 11, fontWeight: 700, fontFamily: "Space Grotesk" }}>{b}</div>;
          })}
        </div>
      </Glass>

      {/* Scoring pad — everything visible, no scroll */}
      <Glass style={{ padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 6 }}>
          {[0, 1, 2, 3].map(n => <button key={n} onClick={() => commitBall(n)} className="press" style={runBtnCompact()}>{n}</button>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 6 }}>
          <button onClick={() => commitBall(4)} className="press" style={runBtnCompact("#FFB800", true)}>4</button>
          <button onClick={() => commitBall(6)} className="press" style={runBtnCompact("#FFB800", true)}>6</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 6 }}>
          <button onClick={() => commitBall("Wd")} className="press" style={extraBtnCompact()}>Wide</button>
          <button onClick={() => commitBall("Nb")} className="press" style={extraBtnCompact()}>No ball</button>
          <button onClick={() => { commitBall("W"); dismissStriker(); }} className="press" style={wicketBtnCompact()}>Wicket</button>
        </div>
      </Glass>

      {pickerRole && (
        <PlayerPicker
          role={pickerRole}
          squad={pickerRole === "bowler" ? bowlingSquad : battingSquad}
          dismissed={pickerRole === "bowler" ? [] : dismissed}
          current={m[pickerRole]}
          onPick={(name) => setPlayer(pickerRole, name)}
          onClose={() => setPickerRole(null)}
        />
      )}

      {showOvers && <OversPanel overHistory={overHistory} currentOver={currentOver} overRuns={overRuns} ballChipStyle={ballChipStyle} onClose={() => setShowOvers(false)} color={color} />}

      {showPlayers && (
        <PlayersPanel
          m={m} battingSquad={battingSquad} bowlingSquad={bowlingSquad}
          dismissed={dismissed} striker={m.striker} nonStriker={m.nonStriker} yetToBat={yetToBat}
          onClose={() => setShowPlayers(false)}
        />
      )}
    </div>
  );
}

function PlayerSlot({ label, value, onClick, accent, highlight }) {
  return (
    <button onClick={onClick} className="press" style={{
      flex: 1, padding: "8px 6px", borderRadius: 12, cursor: "pointer", textAlign: "center",
      border: `1px solid ${highlight && value ? accent + "50" : "rgba(255,255,255,0.1)"}`,
      background: highlight && value ? accent + "12" : "rgba(255,255,255,0.03)",
    }}>
      <div style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.03em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: value ? "#fff" : "rgba(255,255,255,0.3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value || "Select"}{highlight && value ? "*" : ""}
      </div>
    </button>
  );
}

function runBtnCompact(accent, boundary) {
  return {
    padding: "13px 0", borderRadius: 12, border: `1px solid ${boundary ? "rgba(255,184,0,0.3)" : "rgba(255,255,255,0.1)"}`,
    background: boundary ? "rgba(255,184,0,0.1)" : "rgba(255,255,255,0.05)", color: accent || "#fff",
    fontSize: 16, fontWeight: 700, fontFamily: "Space Grotesk", cursor: "pointer",
  };
}
function extraBtnCompact() {
  return { padding: "11px 0", borderRadius: 12, border: "1px solid rgba(78,197,255,0.3)", background: "rgba(78,197,255,0.08)", color: "#4EC5FF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" };
}
function wicketBtnCompact() {
  return { padding: "11px 0", borderRadius: 12, border: "1px solid rgba(255,70,85,0.35)", background: "rgba(255,70,85,0.1)", color: "#FF6B78", fontSize: 11.5, fontWeight: 700, cursor: "pointer" };
}

// ---------- Player picker (striker/non-striker/bowler) ----------
function PlayerPicker({ role, squad, dismissed, current, onPick, onClose }) {
  const label = role === "striker" ? "Select striker" : role === "nonStriker" ? "Select non-striker" : "Select bowler";
  const available = squad.filter(p => !dismissed.includes(p));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 110 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#12181F", borderTop: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "10px 20px 28px", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 18px" }} />
        <h3 style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, margin: "0 0 14px" }}>{label}</h3>
        {available.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>No players available. Add players in Squads.</div>}
        {available.map(p => (
          <button key={p} onClick={() => onPick(p)} className="press" style={{
            width: "100%", textAlign: "left", padding: "13px 14px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
            border: `1px solid ${current === p ? "rgba(61,220,151,0.4)" : "rgba(255,255,255,0.08)"}`,
            background: current === p ? "rgba(61,220,151,0.1)" : "rgba(255,255,255,0.03)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{p}</span>
            {current === p && <Check size={15} color="#3DDC97" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Full over history panel ----------
function OversPanel({ overHistory, currentOver, overRuns, ballChipStyle, onClose, color }) {
  const allOvers = [...overHistory, ...(currentOver.length ? [currentOver] : [])];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0E12", zIndex: 120, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: "rgba(10,14,18,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <button onClick={onClose} className="press" style={ghostBtn}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0 }}>Over-by-over</h2>
      </div>
      <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
        {allOvers.length === 0 && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 40 }}>No overs bowled yet</div>}
        {allOvers.slice().reverse().map((over, ri) => {
          const overNum = allOvers.length - ri;
          const isCurrent = ri === 0 && over === currentOver && currentOver.length > 0 && currentOver.length < 6;
          return (
            <Glass key={overNum} style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, fontFamily: "Space Grotesk", color }}>{overNum}</div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Over {overNum}{isCurrent ? " · in progress" : ""}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk", color: "#fff" }}>{overRuns(over)} runs</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {over.map((b, i) => {
                  const c = ballChipStyle(b);
                  return <div key={i} style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, fontSize: 12, fontWeight: 700, fontFamily: "Space Grotesk" }}>{b}</div>;
                })}
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Players panel (batting order, dismissed, yet to bat) ----------
function PlayersPanel({ m, battingSquad, bowlingSquad, dismissed, striker, nonStriker, yetToBat, onClose }) {
  const color = SPORT_COLOR.cricket;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0E12", zIndex: 120, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: "rgba(10,14,18,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <button onClick={onClose} className="press" style={ghostBtn}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0 }}>Players</h2>
      </div>
      <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.03em" }}>{m.a.name.toUpperCase()} · BATTING</div>

        <Glass style={{ padding: 4, marginBottom: 18, overflow: "hidden" }}>
          {[striker, nonStriker].filter(Boolean).map((p, i) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#3DDC97" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", flex: 1 }}>{p}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#3DDC97" }}>{p === striker ? "ON STRIKE" : "BATTING"}</span>
            </div>
          ))}
          {yetToBat.map(p => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", flex: 1 }}>{p}</span>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>YET TO BAT</span>
            </div>
          ))}
          {dismissed.map(p => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#FF4655" }} />
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", flex: 1, textDecoration: "line-through" }}>{p}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#FF6B78" }}>OUT</span>
            </div>
          ))}
          {battingSquad.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>No players added yet</div>}
        </Glass>

        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.03em" }}>{m.b.name.toUpperCase()} · BOWLING</div>
        <Glass style={{ padding: 4, overflow: "hidden" }}>
          {bowlingSquad.map(p => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 14, color: p === m.bowler ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: p === m.bowler ? 600 : 400, flex: 1 }}>{p}</span>
              {p === m.bowler && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4EC5FF" }}>BOWLING</span>}
            </div>
          ))}
          {bowlingSquad.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>No players added yet</div>}
        </Glass>
      </div>
    </div>
  );
}

// ============================================================
// SOCCER SCORER
// ============================================================
function SoccerScorer({ m, color, visibility, onUpdate }) {
  const [showRoster, setShowRoster] = useState(false);
  const [pendingSide, setPendingSide] = useState(null);
  const events = m.events || [];

  const addEvent = (side, type) => {
    onUpdate(m.id, (draft) => {
      draft.events = [...(draft.events || []), { min: draft.minute || 0, type, team: side, player: "—" }];
      if (type === "goal") draft[side].score = (draft[side].score || 0) + 1;
    });
    setPendingSide(null);
  };

  const eventIcon = (type) => type === "goal" ? "⚽" : type === "yellow" ? "🟨" : type === "red" ? "🟥" : "🔁";

  return (
    <>
      <Glass style={{ padding: "28px 20px", position: "relative", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none", background: `radial-gradient(circle at 50% -10%, ${color}, transparent 60%)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, position: "relative" }}>
          {m.status === "live" ? <LivePill /> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{m.detail}</span>}
          <button onClick={() => setShowRoster(true)} className="press" style={{ ...ghostBtn, padding: "5px 10px" }}><Users size={13} /><span style={{ fontSize: 11.5 }}>Squads</span></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: "rgba(255,255,255,0.75)" }}>{m.a.short}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{m.a.name}</div>
            <FlipNumber value={m.a.score} size={44} />
          </div>
          <div style={{ fontFamily: "Space Grotesk", fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 700, padding: "0 8px" }}>VS</div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: "rgba(255,255,255,0.75)" }}>{m.b.short}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{m.b.name}</div>
            <FlipNumber value={m.b.score} size={44} />
          </div>
        </div>
        {typeof m.minute === "number" && (
          <div style={{ marginTop: 24, position: "relative" }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (m.minute / 90) * 100)}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{m.minute}' · {m.detail}</div>
          </div>
        )}
      </Glass>

      <Glass style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Log an event</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["a", "b"].map(side => (
            <button key={side} onClick={() => setPendingSide(pendingSide === side ? null : side)} className="press" style={{
              flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
              border: `1.5px solid ${pendingSide === side ? color : "rgba(255,255,255,0.1)"}`,
              background: pendingSide === side ? `${color}18` : "rgba(255,255,255,0.04)",
              color: pendingSide === side ? color : "rgba(255,255,255,0.6)",
            }}>{m[side].short}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "goal")} className="press" style={eventBtn(!pendingSide, "#3DDC97")}>⚽ Goal</button>
          <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "yellow")} className="press" style={eventBtn(!pendingSide, "#FFD34E")}>🟨 Yellow card</button>
          <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "red")} className="press" style={eventBtn(!pendingSide, "#FF6B78")}>🟥 Red card</button>
          <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "sub")} className="press" style={eventBtn(!pendingSide, "#4EC5FF")}>🔁 Substitution</button>
        </div>
        {!pendingSide && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 10, textAlign: "center" }}>Select a team above first</div>}
      </Glass>

      <Glass style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Timeline</div>
        {events.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>No events yet</div>}
        {events.slice().reverse().map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < events.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <span style={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 700, color: "rgba(255,255,255,0.4)", width: 28 }}>{e.min}'</span>
            <span style={{ fontSize: 15 }}>{eventIcon(e.type)}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", flex: 1 }}>{e.player}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{m[e.team].short}</span>
          </div>
        ))}
      </Glass>

      {showRoster && <RosterModal m={m} onClose={() => setShowRoster(false)} />}
    </>
  );
}

function eventBtn(disabled, accent) {
  return { padding: "12px 0", borderRadius: 13, border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : accent + "40"}`, background: disabled ? "rgba(255,255,255,0.02)" : accent + "14", color: disabled ? "rgba(255,255,255,0.25)" : accent, fontSize: 12.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer" };
}

// ---------- Simple roster viewer (soccer/badminton/volleyball) ----------
function RosterModal({ m, onClose }) {
  const players = m.players || { a: [], b: [] };
  const captains = m.captains || {};
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#12181F", borderTop: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "10px 20px 28px", maxHeight: "75vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Squads</h2>
        <div style={{ display: "flex", gap: 16 }}>
          {["a", "b"].map(s => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{m[s].name}</div>
              {(players[s] || []).length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No players added</div>}
              {(players[s] || []).map((p, i) => (
                <div key={i} style={{ fontSize: 13.5, color: "#fff", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6 }}>
                  {p}{captains[s] === p && <span style={{ fontSize: 9.5, fontWeight: 700, color: "#FFC933", background: "rgba(255,184,0,0.12)", padding: "1px 6px", borderRadius: 999 }}>C</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CREATE MATCH — multi-step wizard
// Step 1: sport + team names  ->  Step 2: squads + captains  ->  Step 3: toss  ->  create
// ============================================================
function CreateMatch({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState("soccer");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [visibility, setVisibility] = useState("private");

  const [countA, setCountA] = useState(6);
  const [countB, setCountB] = useState(6);
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);
  const [captainA, setCaptainA] = useState(null);
  const [captainB, setCaptainB] = useState(null);

  const [tossWinner, setTossWinner] = useState(null);
  const [tossDecision, setTossDecision] = useState(null);

  const sports = ["soccer", "cricket", "badminton", "volleyball"];
  const needsToss = sport === "cricket";

  const goNext = () => {
    if (step === 1 && teamA && teamB) setStep(2);
    else if (step === 2) setStep(needsToss ? 3 : 4);
    else if (step === 3) setStep(4);
  };
  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(needsToss ? 3 : 2);
  };

  const finalize = () => {
    onCreate({
      sport, teamA, teamB, visibility,
      playersA, playersB, captainA, captainB,
      toss: needsToss ? { winner: tossWinner, decision: tossDecision } : null,
    });
  };

  const stepLabel = ["", "Match details", "Squads & captains", "Toss", "Review"][step];
  const totalSteps = needsToss ? 4 : 3;
  const stepIndex = needsToss ? step : (step === 4 ? 3 : step);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#12181F", borderTop: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "10px 20px 28px", animation: "slideUpSheet 0.3s cubic-bezier(.16,1,.3,1)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.03em" }}>STEP {stepIndex} OF {totalSteps}</span>
          <button onClick={onClose} className="press" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="rgba(255,255,255,0.4)" /></button>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < stepIndex ? SPORT_COLOR[sport] : "rgba(255,255,255,0.1)", transition: "background 0.3s ease" }} />
          ))}
        </div>

        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 21, fontWeight: 700, color: "#fff", margin: "0 0 18px" }}>{stepLabel}</h2>

        {step === 1 && (
          <StepMatchDetails sport={sport} setSport={setSport} teamA={teamA} setTeamA={setTeamA} teamB={teamB} setTeamB={setTeamB} visibility={visibility} setVisibility={setVisibility} sports={sports} />
        )}

        {step === 2 && (
          <StepSquads
            teamA={teamA} teamB={teamB} color={SPORT_COLOR[sport]}
            countA={countA} setCountA={setCountA} countB={countB} setCountB={setCountB}
            playersA={playersA} setPlayersA={setPlayersA} playersB={playersB} setPlayersB={setPlayersB}
            captainA={captainA} setCaptainA={setCaptainA} captainB={captainB} setCaptainB={setCaptainB}
          />
        )}

        {step === 3 && needsToss && (
          <StepToss teamA={teamA} teamB={teamB} color={SPORT_COLOR[sport]} tossWinner={tossWinner} setTossWinner={setTossWinner} tossDecision={tossDecision} setTossDecision={setTossDecision} />
        )}

        {step === 4 && (
          <StepReview sport={sport} teamA={teamA} teamB={teamB} visibility={visibility} playersA={playersA} playersB={playersB} captainA={captainA} captainB={captainB} tossWinner={tossWinner} tossDecision={tossDecision} needsToss={needsToss} />
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {step > 1 && (
            <button onClick={goBack} className="press" style={{ ...ghostBtn, padding: "13px 20px", fontSize: 14 }}><ChevronLeft size={16} />Back</button>
          )}
          {step < 4 ? (
            <button
              disabled={step === 1 && (!teamA || !teamB)}
              onClick={goNext}
              className="press"
              style={{
                flex: 1, padding: "14px 0", borderRadius: 16, border: "none",
                background: (step === 1 && (!teamA || !teamB)) ? "rgba(255,255,255,0.08)" : SPORT_COLOR[sport],
                color: (step === 1 && (!teamA || !teamB)) ? "rgba(255,255,255,0.3)" : "#0A0E12",
                fontWeight: 700, fontSize: 15, cursor: (step === 1 && (!teamA || !teamB)) ? "not-allowed" : "pointer",
              }}
            >Next</button>
          ) : (
            <button onClick={finalize} className="press" style={{ flex: 1, padding: "14px 0", borderRadius: 16, border: "none", background: SPORT_COLOR[sport], color: "#0A0E12", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Start match</button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepMatchDetails({ sport, setSport, teamA, setTeamA, teamB, setTeamB, visibility, setVisibility, sports }) {
  return (
    <>
      <label style={labelStyle}>Sport</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {sports.map(s => (
          <button key={s} onClick={() => setSport(s)} className="press" style={{
            padding: "12px 4px", borderRadius: 14, cursor: "pointer",
            border: `1.5px solid ${sport === s ? SPORT_COLOR[s] : "rgba(255,255,255,0.1)"}`,
            background: sport === s ? `${SPORT_COLOR[s]}18` : "rgba(255,255,255,0.03)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>{SPORT_ICON[s]}</span>
            <span style={{ fontSize: 10.5, color: sport === s ? SPORT_COLOR[s] : "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "capitalize" }}>{s}</span>
          </button>
        ))}
      </div>
      <label style={labelStyle}>Team / Player A</label>
      <input value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="e.g. Riverside FC" style={inputStyle} />
      <label style={labelStyle}>Team / Player B</label>
      <input value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="e.g. Ashford United" style={inputStyle} />
      <label style={labelStyle}>Visibility</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {["private", "public"].map(v => (
          <button key={v} onClick={() => setVisibility(v)} className="press" style={{
            flex: 1, padding: "12px 0", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            border: `1.5px solid ${visibility === v ? "#3DDC97" : "rgba(255,255,255,0.1)"}`,
            background: visibility === v ? "rgba(61,220,151,0.1)" : "rgba(255,255,255,0.03)",
            color: visibility === v ? "#3DDC97" : "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: 13.5, textTransform: "capitalize",
          }}>{v === "public" ? <Globe size={14} /> : <Lock size={14} />} {v}</button>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 0, lineHeight: 1.5 }}>
        {visibility === "public" ? "Anyone on the platform can find and watch this match live." : "Only people with the match link can watch."}
      </p>
    </>
  );
}

function StepSquads({ teamA, teamB, color, countA, setCountA, countB, setCountB, playersA, setPlayersA, playersB, setPlayersB, captainA, setCaptainA, captainB, setCaptainB }) {
  const [teamSide, setTeamSide] = useState("a");
  const isA = teamSide === "a";
  const count = isA ? countA : countB;
  const setCount = isA ? setCountA : setCountB;
  const players = isA ? playersA : playersB;
  const setPlayers = isA ? setPlayersA : setPlayersB;
  const captain = isA ? captainA : captainB;
  const setCaptain = isA ? setCaptainA : setCaptainB;

  const updateName = (i, name) => {
    const next = [...players];
    next[i] = name;
    setPlayers(next);
  };

  // ensure players array length tracks count
  useEffect(() => {
    setPlayers(prev => {
      const next = [...prev];
      while (next.length < count) next.push("");
      while (next.length > count) next.pop();
      return next;
    });
    // eslint-disable-next-line
  }, [count, teamSide]);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["a", teamA], ["b", teamB]].map(([s, name]) => (
          <button key={s} onClick={() => setTeamSide(s)} className="press" style={{
            flex: 1, padding: "11px 0", borderRadius: 13, cursor: "pointer", fontSize: 13.5, fontWeight: 700,
            border: `1.5px solid ${teamSide === s ? color : "rgba(255,255,255,0.1)"}`,
            background: teamSide === s ? `${color}18` : "rgba(255,255,255,0.03)",
            color: teamSide === s ? color : "rgba(255,255,255,0.55)",
          }}>{name || (s === "a" ? "Team A" : "Team B")}</button>
        ))}
      </div>

      <label style={labelStyle}>Number of players</label>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button onClick={() => setCount(Math.max(1, count - 1))} className="press" style={{ ...scoreBtn, width: 38, height: 38, fontSize: 18 }}>−</button>
        <span style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, width: 34, textAlign: "center" }}>{count}</span>
        <button onClick={() => setCount(Math.min(15, count + 1))} className="press" style={{ ...scoreBtn, width: 38, height: 38, fontSize: 18, background: color, color: "#0A0E12", borderColor: color }}>+</button>
      </div>

      <label style={labelStyle}>Player names — tap ⭐ to set captain</label>
      <div style={{ marginBottom: 4 }}>
        {players.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", width: 18, fontFamily: "Space Grotesk", fontWeight: 700 }}>{i + 1}</span>
            <input value={p} onChange={e => updateName(i, e.target.value)} placeholder={`Player ${i + 1} name`} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            <button
              onClick={() => setCaptain(p && captain === p ? null : p)}
              disabled={!p}
              className="press"
              style={{
                width: 38, height: 46, borderRadius: 12, border: `1px solid ${captain && captain === p ? "rgba(255,184,0,0.4)" : "rgba(255,255,255,0.1)"}`,
                background: captain && captain === p ? "rgba(255,184,0,0.14)" : "rgba(255,255,255,0.04)",
                cursor: p ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <Star size={15} color={captain && captain === p ? "#FFC933" : "rgba(255,255,255,0.25)"} fill={captain && captain === p ? "#FFC933" : "none"} />
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 8, lineHeight: 1.5 }}>
        Switch teams above to set up the other squad. You can leave names blank and add players later too.
      </p>
    </>
  );
}

function StepToss({ teamA, teamB, color, tossWinner, setTossWinner, tossDecision, setTossDecision }) {
  return (
    <>
      <label style={labelStyle}>Who won the toss?</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["a", teamA], ["b", teamB]].map(([s, name]) => (
          <button key={s} onClick={() => setTossWinner(s)} className="press" style={{
            flex: 1, padding: "16px 8px", borderRadius: 14, cursor: "pointer",
            border: `1.5px solid ${tossWinner === s ? color : "rgba(255,255,255,0.1)"}`,
            background: tossWinner === s ? `${color}18` : "rgba(255,255,255,0.03)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}>
            <Coins size={18} color={tossWinner === s ? color : "rgba(255,255,255,0.4)"} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: tossWinner === s ? color : "rgba(255,255,255,0.6)" }}>{name}</span>
          </button>
        ))}
      </div>

      <label style={labelStyle}>What did they choose?</label>
      <div style={{ display: "flex", gap: 8 }}>
        {["bat", "bowl"].map(d => (
          <button
            key={d} disabled={!tossWinner} onClick={() => setTossDecision(d)} className="press"
            style={{
              flex: 1, padding: "14px 0", borderRadius: 14, cursor: tossWinner ? "pointer" : "not-allowed",
              border: `1.5px solid ${tossDecision === d ? color : "rgba(255,255,255,0.1)"}`,
              background: tossDecision === d ? `${color}18` : "rgba(255,255,255,0.03)",
              color: !tossWinner ? "rgba(255,255,255,0.25)" : tossDecision === d ? color : "rgba(255,255,255,0.6)",
              fontWeight: 700, fontSize: 13.5, textTransform: "capitalize",
            }}
          >{d} first</button>
        ))}
      </div>
      {!tossWinner && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 12 }}>Select the toss winner first.</p>}
    </>
  );
}

function StepReview({ sport, teamA, teamB, visibility, playersA, playersB, captainA, captainB, tossWinner, tossDecision, needsToss }) {
  const filledA = playersA.filter(Boolean);
  const filledB = playersB.filter(Boolean);
  return (
    <div>
      <Glass style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>{SPORT_ICON[sport]}</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "Space Grotesk" }}>{teamA} vs {teamB}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
          <span style={{ textTransform: "capitalize" }}>{visibility}</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <span>{filledA.length + filledB.length} players added</span>
        </div>
      </Glass>

      {needsToss && tossWinner && (
        <Glass style={{ padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <Coins size={16} color="#FFC933" />
          <span style={{ fontSize: 13, color: "#fff" }}>
            <b>{tossWinner === "a" ? teamA : teamB}</b> won the toss, chose to <b style={{ textTransform: "capitalize" }}>{tossDecision || "…"}</b>
          </span>
        </Glass>
      )}

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>{teamA}</div>
          {filledA.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No players</div>}
          {filledA.map(p => (
            <div key={p} style={{ fontSize: 13, color: "#fff", padding: "5px 0", display: "flex", alignItems: "center", gap: 5 }}>
              {p}{captainA === p && <Star size={11} color="#FFC933" fill="#FFC933" />}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>{teamB}</div>
          {filledB.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No players</div>}
          {filledB.map(p => (
            <div key={p} style={{ fontSize: 13, color: "#fff", padding: "5px 0", display: "flex", alignItems: "center", gap: 5 }}>
              {p}{captainB === p && <Star size={11} color="#FFC933" fill="#FFC933" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 8, letterSpacing: "0.02em" };
const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 13, marginBottom: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14.5, outline: "none", boxSizing: "border-box" };
const scoreBtn = { width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const ghostBtn = { display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "7px 12px", color: "rgba(255,255,255,0.75)", fontSize: 13, cursor: "pointer" };

// ============================================================
// PROFILE + SETTINGS
// ============================================================
function Profile({ onOpenSettings }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Glass style={{ padding: 22, marginBottom: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none", background: "radial-gradient(circle at 20% 0%, #3DDC97, transparent 55%), radial-gradient(circle at 90% 20%, #4EC5FF, transparent 50%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, fontFamily: "Space Grotesk", color: "#0A0E12", boxShadow: "0 8px 24px -6px rgba(61,220,151,0.4), inset 0 1px 0 rgba(255,255,255,0.3)" }}>E</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 19, fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk" }}>Elite</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,184,0,0.14)", border: "1px solid rgba(255,184,0,0.35)", color: "#FFC933", borderRadius: 999, padding: "2px 7px", fontSize: 9.5, fontWeight: 700 }}><Star size={9} fill="#FFC933" /> PRO</span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Organiser · Member since 2025</div>
          </div>
          <button onClick={onOpenSettings} className="press" style={{ width: 36, height: 36, borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Settings size={16} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </Glass>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[["12", "Matches", Trophy], ["4", "Sports", Zap], ["3", "Public", Globe]].map(([n, l, Icon]) => (
          <Glass key={l} style={{ padding: "16px 8px", textAlign: "center" }}>
            <Icon size={14} color="rgba(255,255,255,0.35)" style={{ marginBottom: 6 }} />
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, color: "#fff" }}>{n}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
          </Glass>
        ))}
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10, letterSpacing: "0.02em" }}>YOUR MATCHES</div>
      {seedMatches.slice(0, 3).map(m => (
        <Glass key={m.id} style={{ padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>{SPORT_ICON[m.sport]}</span>
            <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)" }}>{m.a.name} vs {m.b.name}</span>
          </div>
          {m.visibility === "public" ? <Globe size={13} color="#3DDC97" /> : <Lock size={13} color="rgba(255,255,255,0.35)" />}
        </Glass>
      ))}
    </div>
  );
}

function SettingsPanel({ onBack }) {
  const [toggles, setToggles] = useState({ notifications: true, publicByDefault: false, darkMode: true, sound: true });
  const set = (k) => setToggles(t => ({ ...t, [k]: !t[k] }));

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.04em", padding: "0 4px" }}>{title}</div>
      <Glass style={{ padding: 4, overflow: "hidden" }}>{children}</Glass>
    </div>
  );

  const ToggleRow = ({ icon: Icon, label, sub, checked, onChange, last }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 12px", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color="rgba(255,255,255,0.65)" /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={onChange} className="press" style={{ width: 42, height: 25, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: checked ? "#3DDC97" : "rgba(255,255,255,0.12)", transition: "background 0.2s ease", flexShrink: 0 }}>
        <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 20 : 3, transition: "left 0.2s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );

  const LinkRow = ({ icon: Icon, label, sub, last, danger }) => (
    <div className="press" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 12px", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: danger ? "rgba(255,70,85,0.1)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color={danger ? "#FF6B78" : "rgba(255,255,255,0.65)"} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: danger ? "#FF6B78" : "#fff" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
    </div>
  );

  return (
    <div style={{ animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} className="press" style={ghostBtn}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h1 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, margin: 0 }}>Settings</h1>
      </div>
      <Section title="PREFERENCES">
        <ToggleRow icon={Bell} label="Notifications" sub="Live score alerts for followed matches" checked={toggles.notifications} onChange={() => set("notifications")} />
        <ToggleRow icon={Globe} label="Public by default" sub="New matches start visible to everyone" checked={toggles.publicByDefault} onChange={() => set("publicByDefault")} />
        <ToggleRow icon={Moon} label="Dark mode" sub="Always on for this app" checked={toggles.darkMode} onChange={() => set("darkMode")} last />
      </Section>
      <Section title="ACCOUNT">
        <LinkRow icon={User} label="Edit profile" sub="Name, photo, bio" />
        <LinkRow icon={Shield} label="Privacy" sub="Who can find and message you" />
        <LinkRow icon={Award} label="Organiser tools" sub="Tournament brackets, sponsors" last />
      </Section>
      <Section title="SUPPORT">
        <LinkRow icon={HelpCircle} label="Help center" />
        <LinkRow icon={LogOut} label="Log out" danger last />
      </Section>
      <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 20 }}>Scoreline v1.0</div>
    </div>
  );
}

// ============================================================
// NAV CONFIG
// ============================================================
const NAV = [
  { id: "home", label: "Live", icon: Home },
  { id: "explore", label: "Explore", icon: Search },
  { id: "create", label: "Create", icon: PlusCircle },
  { id: "leaderboard", label: "Ranks", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
];

// ============================================================
// APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState("home");
  const [matches, setMatches] = useState(seedMatches);
  const [activeMatch, setActiveMatch] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 900 : true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setMatches(prev => prev.map(m => (m.id === "m1" && m.status === "live" && m.minute < 90) ? { ...m, minute: m.minute + 1 } : m));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const updateMatch = (id, mutator) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== id) return m;
      const draft = JSON.parse(JSON.stringify(m));
      mutator(draft);
      return draft;
    }));
    setActiveMatch(prev => {
      if (!prev || prev.id !== id) return prev;
      const draft = JSON.parse(JSON.stringify(prev));
      mutator(draft);
      return draft;
    });
  };

  const openMatch = (m) => setActiveMatch(matches.find(x => x.id === m.id) || m);

  const handleCreate = ({ sport, teamA, teamB, visibility, playersA, playersB, captainA, captainB, toss }) => {
    const id = "m" + Date.now();
    const cleanA = (playersA || []).filter(Boolean);
    const cleanB = (playersB || []).filter(Boolean);
    const isCricket = sport === "cricket";
    const battingFirst = isCricket && toss ? (toss.decision === "bat" ? toss.winner : (toss.winner === "a" ? "b" : "a")) : "a";

    const newMatch = {
      id, sport, status: "live", visibility,
      a: { name: teamA, short: teamA.slice(0, 3).toUpperCase(), score: isCricket ? "0/0" : 0, runs: 0, wickets: 0, ballsBowled: 0, overs: "0.0", sets: (sport === "badminton" || sport === "volleyball") ? [] : undefined },
      b: { name: teamB, short: teamB.slice(0, 3).toUpperCase(), score: isCricket ? "—" : 0, sets: (sport === "badminton" || sport === "volleyball") ? [] : undefined },
      minute: sport === "soccer" ? 0 : null, detail: isCricket && toss ? `${toss.winner === "a" ? teamA : teamB} won the toss, chose to ${toss.decision}` : "Just started",
      balls: [], overHistory: [], events: [],
      players: { a: cleanA, b: cleanB },
      captains: { a: captainA, b: captainB },
      dismissed: [],
      toss: toss || null,
      striker: null, nonStriker: null, bowler: null,
    };
    // orient batting team into slot "a" for the cricket scorer's model
    if (isCricket && battingFirst === "b") {
      const tmp = newMatch.a; newMatch.a = { ...newMatch.b, score: "0/0", runs: 0, wickets: 0, ballsBowled: 0, overs: "0.0" }; newMatch.b = { ...tmp, score: "—" };
      const tmpP = newMatch.players.a; newMatch.players.a = newMatch.players.b; newMatch.players.b = tmpP;
      const tmpC = newMatch.captains.a; newMatch.captains.a = newMatch.captains.b; newMatch.captains.b = tmpC;
    }

    setMatches(prev => [newMatch, ...prev]);
    setShowCreate(false);
    setTab("home");
    setActiveMatch(newMatch);
  };

  const liveMatches = matches.filter(m => m.status === "live");
  const upcomingMatches = matches.filter(m => m.status === "scheduled");
  const finalMatches = matches.filter(m => m.status === "final");

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E12", color: "#fff", fontFamily: "Inter, sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulseDot { 0% { box-shadow: 0 0 0 0 rgba(255,70,85,0.55); } 70% { box-shadow: 0 0 0 7px rgba(255,70,85,0); } 100% { box-shadow: 0 0 0 0 rgba(255,70,85,0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheenMove { 0% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(220%) skewX(-20deg); } }
        .liquid-sheen { position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); animation: sheenMove 7s ease-in-out infinite; pointer-events: none; }
        .match-card { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1); }
        .match-card:active { transform: scale(0.98); }
        .press { transition: transform 0.12s cubic-bezier(.34,1.56,.64,1), opacity 0.12s ease; }
        .press:active { transform: scale(0.94); opacity: 0.85; }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        input:focus { border-color: rgba(255,255,255,0.3) !important; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        button { will-change: transform; }
      `}</style>

      {isDesktop && (
        <LiquidGlassShell style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.08)", padding: "24px 14px", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px", marginBottom: 32, position: "relative" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px -4px rgba(61,220,151,0.5)" }}><Flame size={16} color="#0A0E12" strokeWidth={2.5} /></div>
            <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 17 }}>Scoreline</span>
          </div>
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id && !activeMatch && !showSettings;
            return (
              <button key={n.id} className="press" onClick={() => { n.id === "create" ? setShowCreate(true) : (setTab(n.id), setActiveMatch(null), setShowSettings(false)); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", marginBottom: 4, borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", position: "relative", background: active ? "rgba(255,255,255,0.09)" : "transparent", boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.1)" : "none", color: active ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 14.5, fontWeight: 600, width: "100%" }}>
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />{n.label}
              </button>
            );
          })}
          <div style={{ marginTop: "auto", position: "relative" }}>
            <Glass onClick={() => { setTab("profile"); setActiveMatch(null); setShowSettings(true); }} style={{ padding: 14, cursor: "pointer" }} className="press">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: "#0A0E12" }}>E</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>Elite</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)" }}>View settings</div>
                </div>
                <Settings size={14} color="rgba(255,255,255,0.4)" />
              </div>
            </Glass>
          </div>
        </LiquidGlassShell>
      )}

      <div style={{ flex: 1, maxWidth: isDesktop ? 640 : "100%", margin: isDesktop ? "0 auto" : 0, width: "100%" }}>
        <div style={{ padding: isDesktop ? "28px 24px 100px" : "20px 16px 100px" }}>
          {!isDesktop && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px -4px rgba(61,220,151,0.5)" }}><Flame size={14} color="#0A0E12" strokeWidth={2.5} /></div>
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 16 }}>Scoreline</span>
            </div>
          )}

          {showSettings ? (
            <SettingsPanel onBack={() => setShowSettings(false)} />
          ) : activeMatch ? (
            <MatchDetail m={activeMatch} onBack={() => setActiveMatch(null)} onUpdate={updateMatch} />
          ) : tab === "home" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>Live right now</h1>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>{liveMatches.length} matches in progress across 4 sports</p>
              {liveMatches.map(m => <MatchCard key={m.id} m={m} onOpen={openMatch} />)}
              {upcomingMatches.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "24px 0 12px" }}><Calendar size={13} color="rgba(255,255,255,0.4)" /><span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>UPCOMING</span></div>
                  {upcomingMatches.map(m => <UpcomingCard key={m.id} m={m} onOpen={openMatch} />)}
                </>
              )}
              {finalMatches.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "24px 0 12px", letterSpacing: "0.02em" }}>RECENT RESULTS</div>
                  {finalMatches.map(m => <MatchCard key={m.id} m={m} onOpen={openMatch} />)}
                </>
              )}
            </div>
          ) : tab === "explore" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 700, margin: "0 0 16px" }}>Explore</h1>
              <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 14px", marginBottom: 20, alignItems: "center" }}>
                <Search size={16} color="rgba(255,255,255,0.4)" />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Search public matches, teams, players…</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {["soccer", "cricket", "badminton", "volleyball"].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13 }}>{SPORT_ICON[s]} <span style={{ textTransform: "capitalize" }}>{s}</span></div>
                ))}
              </div>
              {matches.filter(m => m.visibility === "public").map(m => <MatchCard key={m.id} m={m} onOpen={openMatch} />)}
            </div>
          ) : tab === "leaderboard" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 700, margin: "0 0 16px" }}>Leaderboard</h1>
              {["Riverside FC", "Delta Strikers", "Sunset Spikers", "N. Rao"].map((name, i) => (
                <Glass key={name} style={{ padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: 16, color: i === 0 ? "#FFB800" : "rgba(255,255,255,0.4)", width: 20 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>{12 - i * 2} wins</span>
                </Glass>
              ))}
            </div>
          ) : (
            <Profile onOpenSettings={() => setShowSettings(true)} />
          )}
        </div>
      </div>

      {!isDesktop && (
        <LiquidGlassShell style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, borderTop: "1px solid rgba(255,255,255,0.1)", borderRadius: "22px 22px 0 0", display: "flex", justifyContent: "space-around", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))" }}>
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id && !activeMatch && !showSettings;
            const isCreate = n.id === "create";
            return (
              <button key={n.id} className="navicon press" onClick={() => { isCreate ? setShowCreate(true) : (setTab(n.id), setActiveMatch(null), setShowSettings(false)); }} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 10px", color: active ? "#3DDC97" : "rgba(255,255,255,0.45)" }}>
                {isCreate ? (
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: -2, boxShadow: "0 4px 14px -4px rgba(61,220,151,0.5)" }}><PlusCircle size={18} color="#0A0E12" strokeWidth={2.5} /></div>
                ) : (<Icon size={21} strokeWidth={active ? 2.4 : 2} />)}
                {!isCreate && <span style={{ fontSize: 9.5, fontWeight: 600 }}>{n.label}</span>}
              </button>
            );
          })}
        </LiquidGlassShell>
      )}

      {showCreate && <CreateMatch onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
