import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Home, Trophy, PlusCircle, User, Search, ChevronLeft, Lock, Globe,
  Flame, X, Users, Settings, Bell, Shield, Moon, Sun, ChevronRight,
  LogOut, HelpCircle, Star, UserPlus, Undo2, Award,
  Clock, Calendar, Zap, Check, Coins, Grid3x3, ArrowLeftRight,
  AlertCircle, Download, Smartphone, ChevronsLeft, ChevronsRight,
  Eye, PenLine, Sliders,
} from "lucide-react";
import {
  displayBall, ballChipStyle, applyBall, undoLastBall, overRuns, isLegalDelivery, formatOvers,
  checkInningsComplete, chaseStats, summarizeInnings, maxWicketsFor, computeMatchResult,
} from "./lib/cricketEngine.js";
import {
  loadSettings, saveSettings, loadProfile, saveProfile,
  loadMatches, saveMatches, getDeviceId,
  shouldShowInstallNudge, markInstallNudgeShown,
} from "./lib/storage.js";
import {
  isInstallAvailable, onInstallAvailabilityChange, promptInstall, isRunningStandalone,
} from "./lib/pwaInstall.js";

// ============================================================
// DESIGN TOKENS
// ============================================================
const SPORT_COLOR = { soccer: "#3DDC97", cricket: "#FFB800", badminton: "#4EC5FF", volleyball: "#B98BFF" };
const SPORT_ICON = { soccer: "⚽", cricket: "🏏", badminton: "🏸", volleyball: "🏐" };

// ============================================================
// SEED DATA
// ============================================================
// SYSTEM_OWNER marks demo matches as not owned by the current device, so
// they behave like matches created by other people: viewable, not editable.
const SYSTEM_OWNER = "system-demo";

function buildSeedMatches() {
  return [
    {
      id: "m1", sport: "soccer", status: "live", visibility: "public", ownerId: SYSTEM_OWNER,
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
      id: "m2", sport: "cricket", status: "live", visibility: "public", ownerId: SYSTEM_OWNER,
      a: { name: "Delta Strikers", short: "DEL", score: "142/1", overs: "16.2", runs: 142, wickets: 1, ballsBowled: 98 },
      b: { name: "Coastal XI", short: "COA", score: "—", overs: "" },
      minute: null, detail: "Delta Strikers batting · 1st Innings",
      overLimit: 20,
      innings: 1, inningsComplete: false, completionReason: null,
      overHistory: [[1, 4, 0, 1, 2, 0], [0, 0, 6, 1, 0, "W"], [4, 4, 1, 0, 0, 1]],
      balls: [1, 4, 0], batterStats: {}, bowlerStats: {},
      striker: "A. Kade", nonStriker: "V. Rana", bowler: "T. Okafor",
      players: { a: ["A. Kade", "V. Rana", "S. Bhatt", "L. Marsh"], b: ["T. Okafor", "R. Singh", "C. Botha", "F. Zaman"] },
      captains: { a: "A. Kade", b: "T. Okafor" },
      dismissed: ["S. Bhatt"],
      toss: { winner: "a", decision: "bat" },
    },
    {
      id: "m3", sport: "badminton", status: "live", visibility: "private", ownerId: SYSTEM_OWNER,
      a: { name: "N. Rao", short: "RAO", score: 21, sets: [21, 18] },
      b: { name: "K. Meyer", short: "MEY", score: 18, sets: [15, 21] },
      minute: null, detail: "Game 3 · Decider",
      players: { a: ["N. Rao"], b: ["K. Meyer"] },
    },
    {
      id: "m4", sport: "volleyball", status: "scheduled", visibility: "public", ownerId: SYSTEM_OWNER,
      a: { name: "Sunset Spikers", short: "SUN", score: 0 },
      b: { name: "Northgate", short: "NOR", score: 0 },
      minute: null, detail: "Today, 7:30 PM", scheduledAt: "Today, 7:30 PM",
      players: { a: [], b: [] },
    },
    {
      id: "m5", sport: "soccer", status: "final", visibility: "public", ownerId: SYSTEM_OWNER,
      a: { name: "Harbor City", short: "HAR", score: 3 },
      b: { name: "Elm Rangers", short: "ELM", score: 3 },
      minute: null, detail: "Full Time",
      players: { a: [], b: [] },
    },
    {
      id: "m6", sport: "cricket", status: "scheduled", visibility: "public", ownerId: SYSTEM_OWNER,
      a: { name: "Northside CC", short: "NOR", score: "—" },
      b: { name: "Valley Titans", short: "VAL", score: "—" },
      minute: null, detail: "Tomorrow, 9:00 AM", scheduledAt: "Tomorrow, 9:00 AM",
      overLimit: 20,
      players: { a: [], b: [] },
    },
    {
      id: "m7", sport: "badminton", status: "scheduled", visibility: "private", ownerId: SYSTEM_OWNER,
      a: { name: "Priya S.", short: "PRI", score: 0 },
      b: { name: "J. Wexler", short: "WEX", score: 0 },
      minute: null, detail: "Fri, 6:00 PM", scheduledAt: "Fri, 6:00 PM",
      players: { a: [], b: [] },
    },
  ];
}

// ============================================================
// THEME — light/dark tokens driven by settings.darkMode
// ============================================================
function useTheme(dark) {
  return useMemo(() => ({
    bg: dark ? "#0A0E12" : "#F4F6F8",
    text: dark ? "#fff" : "#12181F",
    textDim: dark ? "rgba(255,255,255,0.5)" : "rgba(18,24,31,0.55)",
    textFaint: dark ? "rgba(255,255,255,0.35)" : "rgba(18,24,31,0.35)",
    glassBg: dark ? "linear-gradient(155deg, rgba(255,255,255,0.065), rgba(255,255,255,0.018) 60%)" : "linear-gradient(155deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7) 60%)",
    glassBorder: dark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(18,24,31,0.08)",
    glassShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px -12px rgba(0,0,0,0.5)" : "inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 24px -12px rgba(18,24,31,0.15)",
    inputBg: dark ? "rgba(255,255,255,0.04)" : "rgba(18,24,31,0.04)",
    inputBorder: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(18,24,31,0.12)",
    // Color-only token (no "1px solid " prefix) — use this whenever a
    // border color needs to be interpolated inside another template
    // string (e.g. toggle buttons choosing between an accent color and
    // the neutral color). Composing full shorthand strings inside each
    // other silently produces invalid CSS that browsers reject wholesale,
    // leaving a stale border in place — this token exists specifically to
    // avoid that trap.
    inputBorderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(18,24,31,0.12)",
    hairline: dark ? "rgba(255,255,255,0.05)" : "rgba(18,24,31,0.07)",
    chipBg: dark ? "rgba(255,255,255,0.06)" : "rgba(18,24,31,0.05)",
    surface: dark ? "#12181F" : "#ffffff",
    dark,
  }), [dark]);
}

// ============================================================
// GLASS PRIMITIVES (theme-aware)
// ============================================================
function Glass({ children, style, onClick, className, tint, theme }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: "relative",
        background: tint ? `linear-gradient(155deg, ${tint}14, ${theme.dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)"} 60%)` : theme.glassBg,
        border: theme.glassBorder,
        boxShadow: theme.glassShadow,
        // Backdrop blur is genuinely expensive to keep recomputing during
        // scroll, and this component renders dozens of times per screen
        // (every match card, every list row). 12px reads as visually
        // identical to 20px against these translucent fills but costs
        // noticeably less to composite — the earlier 20px value was
        // chosen for looks alone without checking scroll cost.
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 20, ...style,
      }}
    >
      {children}
    </div>
  );
}

function LiquidGlassShell({ children, style, theme }) {
  return (
    <div style={{
      position: "relative",
      background: theme.dark
        ? "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.05))"
        : "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.75))",
      backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)",
      boxShadow: theme.dark
        ? "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.04), 0 -8px 32px -8px rgba(0,0,0,0.45)"
        : "inset 0 1px 0 rgba(255,255,255,0.9), 0 -8px 32px -8px rgba(18,24,31,0.12)",
      overflow: "hidden", ...style,
    }}>
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

// Toast for "Over completed" style notices — auto-dismisses.
function Toast({ message, onDone, theme, accent }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200,
      animation: "toastIn 0.25s cubic-bezier(.16,1,.3,1)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 999,
        background: theme.dark ? "rgba(18,24,31,0.95)" : "rgba(255,255,255,0.97)",
        border: `1px solid ${accent}55`, boxShadow: "0 12px 32px -8px rgba(0,0,0,0.4)",
        backdropFilter: "blur(16px)",
      }}>
        <Check size={15} color={accent} />
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{message}</span>
      </div>
    </div>
  );
}

function labelStyle(theme) { return { display: "block", fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 8, letterSpacing: "0.02em" }; }
function inputStyle(theme, error) { return { width: "100%", padding: "13px 14px", borderRadius: 13, marginBottom: 16, background: theme.inputBg, border: error ? "1px solid #FF6B78" : theme.inputBorder, color: theme.text, fontSize: 14.5, outline: "none", boxSizing: "border-box" }; }
function scoreBtn(theme) { return { width: 32, height: 32, borderRadius: 9, border: theme.inputBorder, background: theme.inputBg, color: theme.text, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }; }
function ghostBtn(theme) { return { display: "flex", alignItems: "center", gap: 4, background: theme.inputBg, border: theme.inputBorder, borderRadius: 999, padding: "7px 12px", color: theme.textDim, fontSize: 13, cursor: "pointer" }; }

// Neutral action-button style (run/extras/wicket pads): no permanent colored
// border pretending to be a "selected" state — these are one-shot taps, not toggles.
function actionBtn(theme, accentColor) {
  return {
    padding: "13px 0", borderRadius: 12, border: theme.inputBorder,
    background: theme.inputBg, color: accentColor || theme.text,
    fontSize: 15, fontWeight: 700, fontFamily: "Space Grotesk", cursor: "pointer",
  };
}

// ============================================================
// MATCH / UPCOMING CARDS
// ============================================================
// Memoized: with dozens of these in a scrolling feed and matches state
// updating every few seconds (the live-minute ticker) or every scoring
// tap, re-rendering every card on every update was the actual jank
// source — verified by tracing which state changes touched which
// components, not assumed. React.memo skips re-render for any card
// whose own props are unchanged, so a tick to match m1 no longer forces
// every other card in the feed to redo work.
const MatchCard = React.memo(function MatchCard({ m, onOpen, theme, isOwner }) {
  const color = SPORT_COLOR[m.sport];
  const isLive = m.status === "live";
  const isEnded = m.status === "final";
  return (
    <Glass onClick={() => onOpen(m)} theme={theme} style={{ padding: 16, cursor: "pointer", position: "relative", overflow: "hidden", marginBottom: 12 }} className="match-card">
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color, opacity: isLive ? 1 : 0.3 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{SPORT_ICON[m.sport]}</span>
          <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: "capitalize" }}>{m.sport}</span>
          {m.visibility === "private" && <Lock size={11} color={theme.textFaint} />}
          {isOwner ? (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: "#4EC5FF", background: "rgba(78,197,255,0.12)", padding: "2px 6px", borderRadius: 999 }}><PenLine size={9} />YOURS</span>
          ) : null}
        </div>
        {isLive ? <LivePill small /> : (
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.03em",
            color: isEnded ? theme.textDim : theme.textFaint,
            background: isEnded ? theme.chipBg : "transparent",
            padding: isEnded ? "3px 8px" : 0, borderRadius: 999,
          }}>
            {isEnded ? "ENDED" : "UPCOMING"}
          </span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <Row team={m.a} highlight={isLive} theme={theme} />
        <Row team={m.b} highlight={isLive} theme={theme} />
      </div>
      {isEnded && m.matchResult ? (
        <div style={{ marginTop: 10, fontSize: 11.5, color, fontWeight: 600 }}>
          {m.matchResult.winner === "tie" ? "Match tied" : `${m.matchResult.winner === "first" ? m.firstInningsSummary?.teamName : m.a.name} · ${m.matchResult.summary}`}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 11.5, color: theme.textFaint }}>{m.detail}{m.minute ? ` · ${m.minute}'` : ""}</div>
      )}
    </Glass>
  );
});

function Row({ team, highlight, theme }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: theme.chipBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 800, color: theme.textDim, fontFamily: "Space Grotesk" }}>{team.short}</div>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: theme.text }}>{team.name}</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Space Grotesk", color: highlight ? theme.text : theme.textDim }}>
        {team.score}{team.overs ? <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 500 }}> ({team.overs})</span> : ""}
      </span>
    </div>
  );
}

const UpcomingCard = React.memo(function UpcomingCard({ m, onOpen, theme, isOwner }) {
  const color = SPORT_COLOR[m.sport];
  return (
    <Glass onClick={() => onOpen(m)} tint={color} theme={theme} style={{ padding: 14, cursor: "pointer", marginBottom: 10 }} className="match-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}1c`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{SPORT_ICON[m.sport]}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
              {m.a.name} <span style={{ color: theme.textFaint }}>vs</span> {m.b.name}
              {isOwner && <PenLine size={11} color="#4EC5FF" />}
            </div>
            <div style={{ fontSize: 11, color: theme.textFaint, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><Clock size={10} /> {m.scheduledAt || m.detail}</div>
          </div>
        </div>
        {m.visibility === "private" ? <Lock size={12} color={theme.textFaint} /> : <Globe size={12} color={theme.textFaint} />}
      </div>
    </Glass>
  );
});

// ============================================================
// MATCH DETAIL ROUTER
// ============================================================
function MatchDetail({ m, onBack, onUpdate, theme, isDesktop, isOwner, onToast }) {
  const color = SPORT_COLOR[m.sport];
  const [visibility, setVisibility] = useState(m.visibility);

  return (
    <div style={{ animation: "slideUp 0.35s cubic-bezier(.16,1,.3,1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <button onClick={onBack} style={ghostBtn(theme)} className="press"><ChevronLeft size={18} /> <span style={{ fontSize: 14 }}>Back</span></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isOwner && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: theme.textDim, background: theme.chipBg, padding: "6px 11px", borderRadius: 999 }}>
              <Eye size={13} /> View only
            </span>
          )}
          {isOwner && (
            <button
              onClick={() => setVisibility(v => v === "public" ? "private" : "public")}
              className="press"
              style={{ ...ghostBtn(theme), border: `1px solid ${visibility === "public" ? "rgba(61,220,151,0.4)" : theme.inputBorderColor}`, color: visibility === "public" ? "#3DDC97" : theme.textDim }}
            >
              {visibility === "public" ? <Globe size={14} /> : <Lock size={14} />}
              <span style={{ fontSize: 12.5, fontWeight: 600, textTransform: "capitalize" }}>{visibility}</span>
            </button>
          )}
        </div>
      </div>

      {m.sport === "cricket" ? (
        <CricketScorer m={m} color={color} visibility={visibility} onUpdate={onUpdate} theme={theme} isDesktop={isDesktop} isOwner={isOwner} onToast={onToast} />
      ) : m.sport === "soccer" ? (
        <SoccerScorer m={m} color={color} visibility={visibility} onUpdate={onUpdate} theme={theme} isDesktop={isDesktop} isOwner={isOwner} />
      ) : (
        <GenericScorer m={m} color={color} visibility={visibility} onUpdate={onUpdate} theme={theme} isDesktop={isDesktop} isOwner={isOwner} />
      )}
    </div>
  );
}

// ---------- Generic (badminton / volleyball) ----------
function GenericScorer({ m, color, visibility, onUpdate, theme, isDesktop, isOwner }) {
  const [showRoster, setShowRoster] = useState(false);
  const bump = (side, delta) => {
    if (!isOwner) return;
    onUpdate(m.id, (draft) => { if (typeof draft[side].score === "number") draft[side].score = Math.max(0, draft[side].score + delta); });
  };
  return (
    <div style={isDesktop ? { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, alignItems: "start" } : undefined}>
      <div>
        <Glass theme={theme} style={{ padding: "28px 20px", position: "relative", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none", background: `radial-gradient(circle at 50% -10%, ${color}, transparent 60%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
            <div>{m.status === "live" ? <LivePill /> : <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 700 }}>{m.detail}</span>}</div>
            <button onClick={() => setShowRoster(true)} className="press" style={{ ...ghostBtn(theme), padding: "5px 10px" }}><Users size={13} /><span style={{ fontSize: 11.5 }}>Squads</span></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <TeamBlock team={m.a} color={color} onPlus={() => bump("a", 1)} onMinus={() => bump("a", -1)} theme={theme} readOnly={!isOwner} />
            <div style={{ fontFamily: "Space Grotesk", fontSize: 13, color: theme.textFaint, fontWeight: 700, padding: "0 8px" }}>VS</div>
            <TeamBlock team={m.b} color={color} onPlus={() => bump("b", 1)} onMinus={() => bump("b", -1)} theme={theme} readOnly={!isOwner} />
          </div>
        </Glass>
      </div>
      <div>
        {(m.a.sets || []).length > 0 && (
          <Glass theme={theme} style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 10 }}>Set history</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(m.a.sets || []).map((s, i) => (
                <div key={i} style={{ flex: 1, background: theme.chipBg, borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 15, color: theme.text }}>{s}–{m.b.sets[i]}</div>
                  <div style={{ fontSize: 9.5, color: theme.textFaint, marginTop: 2 }}>SET {i + 1}</div>
                </div>
              ))}
            </div>
          </Glass>
        )}
        {isOwner && (
          <Glass theme={theme} style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 4 }}>Scorer controls</div>
            <div style={{ fontSize: 12.5, color: theme.textFaint, lineHeight: 1.5 }}>Tap the + / − under each team to update live. Changes reflect instantly for every viewer{visibility === "private" ? " with the invite link." : "."}</div>
          </Glass>
        )}
      </div>
      {showRoster && <RosterModal m={m} onClose={() => setShowRoster(false)} theme={theme} />}
    </div>
  );
}

function TeamBlock({ team, color, onPlus, onMinus, theme, readOnly }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.chipBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: theme.textDim }}>{team.short}</div>
      <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 8, fontWeight: 500 }}>{team.name}</div>
      <FlipNumber value={team.score} size={44} color={theme.text} />
      {!readOnly && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
          <button onClick={onMinus} style={scoreBtn(theme)} className="press">−</button>
          <button onClick={onPlus} style={{ ...scoreBtn(theme), background: color, color: "#0A0E12", borderColor: color }} className="press">+</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CRICKET SCORER — real engine, pending-ball confirm flow
// ============================================================
function CricketScorer({ m, color, visibility, onUpdate, theme, isDesktop, isOwner, onToast }) {
  const [showOvers, setShowOvers] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [showMatchSettings, setShowMatchSettings] = useState(false);
  const [showFirstInnings, setShowFirstInnings] = useState(false);
  const [pickerRole, setPickerRole] = useState(null);
  const [pending, setPending] = useState(null);
  // The completion popup is dismissible (per spec) but the resolve options
  // must keep showing until the scorer actually resolves it — so dismissal
  // only hides the modal, it doesn't clear draft.inningsComplete.
  const [popupDismissed, setPopupDismissed] = useState(false);

  const currentOver = m.balls || [];
  const overHistory = m.overHistory || [];
  const battingSquad = (m.players?.a) || [];
  const bowlingSquad = (m.players?.b) || [];
  const dismissed = m.dismissed || [];
  const onStrikeNames = [m.striker, m.nonStriker].filter(Boolean);
  const yetToBat = battingSquad.filter(p => !dismissed.includes(p) && !onStrikeNames.includes(p));
  const batterStats = m.batterStats || {};
  const bowlerStats = m.bowlerStats || {};
  const innings = m.innings || 1;
  const battingSquadSize = battingSquad.length;

  // Reset the "dismissed" flag whenever a fresh completion state appears
  // (e.g. a new wicket falls right at the limit after the previous
  // completion was already resolved) so the popup can surface again.
  useEffect(() => { setPopupDismissed(false); }, [m.inningsComplete, m.completionReason]);

  const selectOutcome = (kind, extra) => {
    if (!isOwner || m.inningsComplete) return;
    if (!m.striker || !m.nonStriker || !m.bowler) return; // both batters + bowler required before any ball
    if (kind === "run") { setPending({ kind: "run", value: extra }); return; }
    if (kind === "wide" || kind === "noball") { setPending({ kind, runs: 1 }); return; }
    if (kind === "bye" || kind === "legbye") { setPending({ kind, runs: 1 }); return; }
    if (kind === "wicket") { setPending({ kind: "wicket" }); return; }
  };

  const adjustPendingRuns = (delta) => {
    setPending(p => { if (!p) return p; return { ...p, runs: Math.max(1, (p.runs || 1) + delta) }; });
  };

  const cancelPending = () => setPending(null);

  const confirmPending = () => {
    if (!pending) return;
    let ball;
    if (pending.kind === "run") ball = pending.value;
    else if (pending.kind === "wicket") ball = "W";
    else ball = { type: pending.kind, runs: pending.runs || 1 };

    let overCompleted = false;
    onUpdate(m.id, (draft) => {
      applyBall(draft, ball);
      overCompleted = !!draft._lastOverCompleted;
      delete draft._lastOverCompleted;

      // After every ball, check whether the innings should now end.
      const target = draft.innings === 2 ? draft.target : undefined;
      const result = checkInningsComplete(draft, battingSquadSize, target);
      if (result.complete && !draft.inningsComplete) {
        draft.inningsComplete = true;
        draft.completionReason = result.reason;

        // If this was the 2nd innings, the MATCH is now over, not just the
        // innings — freeze the result and flip status so the feed and
        // profile can stop treating this as a live match.
        if (draft.innings === 2 && draft.firstInningsSummary) {
          const matchResult = computeMatchResult({
            firstInnings: draft.firstInningsSummary,
            secondInningsTeam: draft.a,
            secondSquadSize: battingSquadSize,
            overLimit: draft.overLimit,
          });
          draft.status = "final";
          draft.matchResult = matchResult;
          draft.detail = matchResult.summary;
        }
      }
    });
    setPending(null);
    if (overCompleted && onToast) onToast(`Over ${overHistory.length + 1} complete`, color);
  };

  const undoBall = () => {
    if (!isOwner) return;
    onUpdate(m.id, (draft) => {
      undoLastBall(draft);
      // Undoing can un-finish an innings (e.g. undoing the wicket that
      // made it all out) — re-check and clear the flag if so.
      const target = draft.innings === 2 ? draft.target : undefined;
      const result = checkInningsComplete(draft, battingSquadSize, target);
      if (!result.complete) {
        draft.inningsComplete = false;
        draft.completionReason = null;
        // Undoing the ball that ended the match reopens it — revert the
        // "final" status and drop the frozen result so scoring can resume.
        if (draft.status === "final") {
          draft.status = "live";
          draft.matchResult = null;
        }
      }
    });
    setPopupDismissed(false);
  };

  const setPlayer = (role, name) => { onUpdate(m.id, (draft) => { draft[role] = name; }); setPickerRole(null); };
  const swapStrike = () => { onUpdate(m.id, (draft) => { const t = draft.striker; draft.striker = draft.nonStriker; draft.nonStriker = t; }); };
  const setOverLimit = (n) => {
    onUpdate(m.id, (draft) => {
      draft.overLimit = n;
      // Raising the limit can un-finish an "overs" completion — re-check.
      const target = draft.innings === 2 ? draft.target : undefined;
      const result = checkInningsComplete(draft, battingSquadSize, target);
      if (!result.complete) {
        draft.inningsComplete = false;
        draft.completionReason = null;
      }
    });
    setPopupDismissed(false);
  };

  const startNextInnings = () => {
    onUpdate(m.id, (draft) => {
      const firstInnings = summarizeInnings(draft, draft.a.name, draft.b.name);
      const target = (draft.a.runs || 0) + 1;

      // swap batting/bowling sides: b now bats, a now bowls
      const newBattingSide = { ...draft.b, score: "0/0", runs: 0, wickets: 0, ballsBowled: 0, overs: "0.0" };
      const newBowlingSide = { ...draft.a };
      draft.a = newBattingSide;
      draft.b = newBowlingSide;

      const tmpPlayers = draft.players.a; draft.players.a = draft.players.b; draft.players.b = tmpPlayers;
      const tmpCaptains = draft.captains.a; draft.captains.a = draft.captains.b; draft.captains.b = tmpCaptains;

      draft.innings = 2;
      draft.target = target;
      draft.firstInningsSummary = firstInnings;
      draft.balls = [];
      draft.overHistory = [];
      draft.batterStats = {};
      draft.bowlerStats = {};
      draft.dismissed = [];
      draft.striker = null;
      draft.nonStriker = null;
      draft.bowler = null;
      draft.inningsComplete = false;
      draft.completionReason = null;
      draft.detail = `${draft.a.name} need ${target} to win`;
    });
    setPopupDismissed(false);
  };

  const pendingLabel = () => {
    if (!pending) return null;
    if (pending.kind === "run") return `${pending.value} run${pending.value === 1 ? "" : "s"}`;
    if (pending.kind === "wide") return `Wide${pending.runs > 1 ? ` + ${pending.runs - 1} run${pending.runs - 1 === 1 ? "" : "s"}` : ""}`;
    if (pending.kind === "noball") return `No ball${pending.runs > 1 ? ` + ${pending.runs - 1} run${pending.runs - 1 === 1 ? "" : "s"}` : ""}`;
    if (pending.kind === "bye") return `Bye × ${pending.runs}`;
    if (pending.kind === "legbye") return `Leg bye × ${pending.runs}`;
    if (pending.kind === "wicket") return "Wicket";
    return "";
  };

  const showRunAdjust = pending && (pending.kind === "bye" || pending.kind === "legbye" || pending.kind === "wide" || pending.kind === "noball");
  const oversUsed = formatOvers(m.a.ballsBowled || 0);
  const needsOpeners = !m.striker || !m.nonStriker;
  const needsBowler = !m.bowler;
  const scoringLocked = m.inningsComplete || needsOpeners || needsBowler;

  const chase = innings === 2 && m.target
    ? chaseStats({ target: m.target, runsScored: m.a.runs || 0, ballsBowled: m.a.ballsBowled || 0, totalBalls: (m.overLimit || 0) * 6 })
    : null;

  // Match is fully over once the 2nd innings itself has completed.
  const matchOver = innings === 2 && m.inningsComplete;
  const matchResult = m.matchResult || (matchOver
    ? computeMatchResult({
        firstInnings: m.firstInningsSummary,
        secondInningsTeam: m.a,
        secondSquadSize: battingSquadSize,
        overLimit: m.overLimit,
      })
    : null);

  const scoringPad = (
    <>
      <Glass theme={theme} style={{ padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <PlayerSlot label="STRIKER" value={m.striker} onClick={() => isOwner && setPickerRole("striker")} accent={color} highlight theme={theme} disabled={!isOwner} required={!m.striker} />
          {isOwner && (
            <button onClick={swapStrike} className="press" title="Swap strike" style={{ width: 30, height: 30, borderRadius: 9, border: theme.inputBorder, background: theme.inputBg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <ArrowLeftRight size={13} color={theme.textDim} />
            </button>
          )}
          <PlayerSlot label="NON-STRIKER" value={m.nonStriker} onClick={() => isOwner && setPickerRole("nonStriker")} accent={color} theme={theme} disabled={!isOwner} required={!m.nonStriker} />
          <PlayerSlot label="BOWLER" value={m.bowler} onClick={() => isOwner && setPickerRole("bowler")} accent="#4EC5FF" theme={theme} disabled={!isOwner} required={!m.bowler} />
        </div>
        {isOwner && (needsOpeners || needsBowler) && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#FFC933", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={12} />
            {needsOpeners && needsBowler ? "Select striker, non-striker and bowler before scoring"
              : needsOpeners ? "Select both striker and non-striker before scoring"
              : "Select a bowler before scoring"}
          </div>
        )}
      </Glass>

      <Glass theme={theme} style={{ padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.textDim, letterSpacing: "0.03em" }}>THIS OVER</span>
          {isOwner && <button onClick={undoBall} className="press" style={{ ...ghostBtn(theme), padding: "4px 9px" }}><Undo2 size={11} /><span style={{ fontSize: 10.5 }}>Undo</span></button>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 26 }}>
          {currentOver.length === 0 && <span style={{ fontSize: 11.5, color: theme.textFaint }}>New over</span>}
          {currentOver.map((b, i) => {
            const c = ballChipStyle(b, theme);
            return <div key={i} style={{ minWidth: 26, height: 26, padding: "0 4px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, fontSize: 10.5, fontWeight: 700, fontFamily: "Space Grotesk" }}>{displayBall(b)}</div>;
          })}
        </div>
      </Glass>

      {pending && isOwner && (
        <Glass theme={theme} tint={color} style={{ padding: 12, marginBottom: 10, border: `1.5px solid ${color}55` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showRunAdjust ? 10 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={15} color={color} />
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{pendingLabel()}</span>
            </div>
            <button onClick={cancelPending} className="press" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color={theme.textFaint} /></button>
          </div>
          {showRunAdjust && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: theme.textDim }}>Runs taken:</span>
              <button onClick={() => adjustPendingRuns(-1)} className="press" style={{ ...scoreBtn(theme), width: 26, height: 26, fontSize: 13 }}>−</button>
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 15, width: 18, textAlign: "center", color: theme.text }}>{pending.runs}</span>
              <button onClick={() => adjustPendingRuns(1)} className="press" style={{ ...scoreBtn(theme), width: 26, height: 26, fontSize: 13, background: color, color: "#0A0E12", borderColor: color }}>+</button>
            </div>
          )}
          <button onClick={confirmPending} className="press" style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: color, color: "#0A0E12", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            Next ball →
          </button>
        </Glass>
      )}

      {isOwner && (
        <Glass theme={theme} style={{ padding: 12, opacity: scoringLocked ? 0.4 : 1, pointerEvents: scoringLocked ? "none" : "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 6 }}>
            {[0, 1, 2, 3].map(n => <button key={n} onClick={() => selectOutcome("run", n)} className="press" style={actionBtn(theme)}>{n}</button>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 6 }}>
            <button onClick={() => selectOutcome("run", 4)} className="press" style={actionBtn(theme, "#FFC933")}>4</button>
            <button onClick={() => selectOutcome("run", 6)} className="press" style={actionBtn(theme, "#FFC933")}>6</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 6 }}>
            <button onClick={() => selectOutcome("bye")} className="press" style={actionBtn(theme, "#B98BFF")}>Bye</button>
            <button onClick={() => selectOutcome("legbye")} className="press" style={actionBtn(theme, "#B98BFF")}>Leg bye</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <button onClick={() => selectOutcome("wide")} className="press" style={actionBtn(theme, "#4EC5FF")}>Wide</button>
            <button onClick={() => selectOutcome("noball")} className="press" style={actionBtn(theme, "#4EC5FF")}>No ball</button>
            <button onClick={() => selectOutcome("wicket")} className="press" style={actionBtn(theme, "#FF6B78")}>Wicket</button>
          </div>
        </Glass>
      )}

      {isOwner && m.inningsComplete && !matchOver && popupDismissed && (
        <InningsCompleteBanner
          reason={m.completionReason}
          onResume={() => setPopupDismissed(false)}
          onNextInnings={innings === 1 ? startNextInnings : null}
          onIncreaseOvers={m.completionReason === "overs" ? () => setShowMatchSettings(true) : null}
          onUndo={undoBall}
          theme={theme}
          color={color}
          isFinalInnings={innings === 2}
        />
      )}
    </>
  );

  return (
    <div className="cricket-shell" style={isDesktop ? { display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, alignItems: "start" } : undefined}>
      <div>
        <Glass theme={theme} style={{ padding: "16px 16px 14px", position: "relative", overflow: "hidden", marginBottom: 10 }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.14, pointerEvents: "none", background: `radial-gradient(circle at 50% -10%, ${color}, transparent 60%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, position: "relative" }}>
            {m.status === "live" ? <LivePill small /> : <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 700 }}>{m.detail}</span>}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowPlayers(true)} className="press" style={{ ...ghostBtn(theme), padding: "5px 9px" }}><Users size={12} /><span style={{ fontSize: 11 }}>Players</span></button>
              <button onClick={() => setShowOvers(true)} className="press" style={{ ...ghostBtn(theme), padding: "5px 9px" }}><Grid3x3 size={12} /><span style={{ fontSize: 11 }}>Overs</span></button>
              {isOwner && <button onClick={() => setShowMatchSettings(true)} className="press" style={{ ...ghostBtn(theme), padding: "5px 9px" }}><Sliders size={12} /></button>}
            </div>
          </div>

          {innings === 2 && m.firstInningsSummary && (
            <button
              onClick={() => setShowFirstInnings(true)}
              className="press"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                gap: 6, marginBottom: 10, fontSize: 11, color: theme.textFaint, position: "relative",
                background: theme.inputBg, border: theme.inputBorder, borderRadius: 10, padding: "8px 10px", cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 700, color: theme.textDim }}>{m.firstInningsSummary.teamName}</span>
                <span>{m.firstInningsSummary.runs}/{m.firstInningsSummary.wickets} ({m.firstInningsSummary.overs} ov)</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: color, fontWeight: 600 }}>
                <Eye size={11} /> View innings
              </span>
            </button>
          )}

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", position: "relative" }}>
            <div>
              <div style={{ fontSize: 12, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>{m.a.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <FlipNumber value={m.a.runs ?? 0} size={38} color={color} />
                <span style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, color: theme.textDim }}>/{m.a.wickets ?? 0}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11.5, color: theme.textFaint }}>{oversUsed}{m.overLimit ? ` / ${m.overLimit}` : ""} ov</div>
              <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>vs {m.b.name}</div>
            </div>
          </div>

          {chase && !m.inningsComplete && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.hairline}`, position: "relative" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: color, marginBottom: 6 }}>
                Need {chase.runsNeeded} run{chase.runsNeeded === 1 ? "" : "s"} off {chase.ballsRemaining} ball{chase.ballsRemaining === 1 ? "" : "s"}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 10.5, color: theme.textFaint }}>
                <span>CRR <b style={{ color: theme.textDim }}>{chase.currentRunRate}</b></span>
                <span>RRR <b style={{ color: theme.textDim }}>{chase.requiredRunRate}</b></span>
              </div>
            </div>
          )}
        </Glass>
        {!isDesktop && scoringPad}
      </div>
      {isDesktop && <div>{scoringPad}</div>}

      {pickerRole && (
        <PlayerPicker
          role={pickerRole}
          squad={pickerRole === "bowler" ? bowlingSquad : battingSquad}
          dismissed={pickerRole === "bowler" ? [] : dismissed}
          excludeSelected={pickerRole === "nonStriker" ? m.striker : pickerRole === "striker" ? m.nonStriker : null}
          current={m[pickerRole]}
          onPick={(name) => setPlayer(pickerRole, name)}
          onClose={() => setPickerRole(null)}
          theme={theme}
        />
      )}
      {showOvers && <OversPanel overHistory={overHistory} currentOver={currentOver} onClose={() => setShowOvers(false)} color={color} theme={theme} />}
      {showPlayers && (
        <PlayersPanel m={m} battingSquad={battingSquad} bowlingSquad={bowlingSquad} dismissed={dismissed} striker={m.striker} nonStriker={m.nonStriker} yetToBat={yetToBat} batterStats={batterStats} bowlerStats={bowlerStats} onClose={() => setShowPlayers(false)} theme={theme} />
      )}
      {showMatchSettings && (
        <CricketMatchSettings overLimit={m.overLimit} onSave={setOverLimit} onClose={() => setShowMatchSettings(false)} theme={theme} color={color} />
      )}
      {showFirstInnings && m.firstInningsSummary && (
        <InningsScorecardPanel innings={m.firstInningsSummary} onClose={() => setShowFirstInnings(false)} theme={theme} color={color} title="1st Innings" />
      )}

      {isOwner && m.inningsComplete && !matchOver && !popupDismissed && (
        <InningsCompletePopup
          reason={m.completionReason}
          battingTeam={m.a.name}
          score={`${m.a.runs || 0}/${m.a.wickets || 0}`}
          overs={m.a.overs}
          isFinalInnings={innings === 2}
          won={innings === 2 && m.completionReason === "target"}
          onDismiss={() => setPopupDismissed(true)}
          onNextInnings={innings === 1 ? startNextInnings : null}
          onIncreaseOvers={m.completionReason === "overs" ? () => setShowMatchSettings(true) : null}
          onUndo={undoBall}
          theme={theme}
          color={color}
        />
      )}

      {matchOver && matchResult && (
        <MatchResultScreen
          m={m}
          result={matchResult}
          theme={theme}
          color={color}
        />
      )}
    </div>
  );
}

// ---------- Innings completion popup ----------
// Wording per reason, in plain, unambiguous English:
//   overs  -> "Overs finished" + Start next innings / Increase over limit
//   wickets-> "All out" (or "N wickets down" framed as all out w/ no-last-man rule) + Start next innings / Undo previous ball
//   target -> "Target reached" (2nd innings only, match over — no further options needed)
function InningsCompletePopup({ reason, battingTeam, score, overs, isFinalInnings, won, onDismiss, onNextInnings, onIncreaseOvers, onUndo, theme, color }) {
  const title = reason === "target" ? "Target reached" : reason === "overs" ? "Overs finished" : "All out";
  const subtitle = reason === "target"
    ? `${battingTeam} won the match — ${score} (${overs} overs)`
    : `${battingTeam} finished on ${score} (${overs} overs)`;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 140, padding: 20 }}>
      <Glass theme={theme} tint={color} style={{ padding: 26, maxWidth: 380, width: "100%", border: `1.5px solid ${color}55`, position: "relative" }}>
        <button onClick={onDismiss} className="press" style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer" }}>
          <X size={17} color={theme.textFaint} />
        </button>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={24} color={color} />
          </div>
        </div>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: theme.text, margin: "0 0 6px", textAlign: "center" }}>{title}</h2>
        <p style={{ fontSize: 13, color: theme.textDim, textAlign: "center", margin: "0 0 22px", lineHeight: 1.5 }}>{subtitle}</p>

        {isFinalInnings ? (
          <div style={{ fontSize: 12.5, color: theme.textFaint, textAlign: "center" }}>The match is complete.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {onNextInnings && (
              <button onClick={onNextInnings} className="press" style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", background: color, color: "#0A0E12", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Start next innings
              </button>
            )}
            {onIncreaseOvers && (
              <button onClick={onIncreaseOvers} className="press" style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: theme.inputBorder, background: theme.inputBg, color: theme.text, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Increase over limit
              </button>
            )}
            {onUndo && (
              <button onClick={() => { onUndo(); onDismiss(); }} className="press" style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: theme.inputBorder, background: theme.inputBg, color: theme.textDim, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
                Undo previous ball
              </button>
            )}
          </div>
        )}
      </Glass>
    </div>
  );
}

// Persistent, dismissible banner shown after the popup is closed but the
// innings is still unresolved — keeps the resolve options reachable without
// blocking the view of the current score.
function InningsCompleteBanner({ reason, onResume, onNextInnings, onIncreaseOvers, onUndo, theme, color, isFinalInnings }) {
  const label = reason === "target" ? "Target reached" : reason === "overs" ? "Overs finished" : "All out";
  return (
    <Glass theme={theme} tint={color} style={{ padding: 12, marginTop: 10, border: `1px solid ${color}45` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isFinalInnings ? 0 : 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} color={color} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.text }}>{label}</span>
        </div>
        <button onClick={onResume} className="press" style={{ ...ghostBtn(theme), padding: "4px 9px", fontSize: 11 }}>View</button>
      </div>
      {!isFinalInnings && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onNextInnings && <button onClick={onNextInnings} className="press" style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: color, color: "#0A0E12", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Start next innings</button>}
          {onIncreaseOvers && <button onClick={onIncreaseOvers} className="press" style={{ padding: "8px 14px", borderRadius: 10, border: theme.inputBorder, background: theme.inputBg, color: theme.text, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Increase over limit</button>}
          {onUndo && <button onClick={onUndo} className="press" style={{ padding: "8px 14px", borderRadius: 10, border: theme.inputBorder, background: theme.inputBg, color: theme.textDim, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Undo previous ball</button>}
        </div>
      )}
    </Glass>
  );
}

// ---------- Full scorecard for one innings (batting + bowling figures) ----------
// Used both for "view previous innings" mid-match and for both scorecards
// on the final result screen.
function InningsScorecardPanel({ innings, onClose, theme, color, title }) {
  const battingOrder = innings.battingOrder || [];
  const bowlingOrder = innings.bowlingOrder || [];
  const dismissed = innings.dismissed || [];
  const batterStats = innings.batterStats || {};
  const bowlerStats = innings.bowlerStats || {};
  // Batters who never got a batterStats entry and were never dismissed
  // simply didn't come to the crease — shown as "did not bat".
  const didNotBat = battingOrder.filter(p => !batterStats[p] && !dismissed.includes(p));
  const batted = battingOrder.filter(p => batterStats[p] || dismissed.includes(p));

  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, zIndex: 150, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: theme.dark ? "rgba(10,14,18,0.92)" : "rgba(244,246,248,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.hairline}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <button onClick={onClose} className="press" style={ghostBtn(theme)}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0, color: theme.text }}>{title || innings.teamName}</h2>
      </div>
      <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
        <Glass theme={theme} tint={color} style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.textDim, marginBottom: 4 }}>{innings.teamName}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "Space Grotesk", fontSize: 30, fontWeight: 700, color: theme.text }}>{innings.runs}/{innings.wickets}</span>
            <span style={{ fontSize: 13, color: theme.textFaint }}>({innings.overs}{innings.overLimit ? ` / ${innings.overLimit}` : ""} ov)</span>
          </div>
        </Glass>

        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textDim, marginBottom: 8, letterSpacing: "0.03em" }}>BATTING</div>
        <Glass theme={theme} style={{ padding: 4, marginBottom: 18, overflow: "hidden" }}>
          {batted.map(p => {
            const stats = batterStats[p] || { runs: 0, balls: 0 };
            const isOut = dismissed.includes(p);
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: `1px solid ${theme.hairline}` }}>
                <span style={{ fontSize: 14, color: isOut ? theme.textDim : theme.text, fontWeight: isOut ? 400 : 600, flex: 1 }}>{p}</span>
                <span style={{ fontSize: 10.5, color: isOut ? "#FF6B78" : "#3DDC97", fontWeight: 700, marginRight: 8 }}>{isOut ? "OUT" : "NOT OUT"}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk", color: theme.text }}>{stats.runs}<span style={{ fontSize: 10.5, color: theme.textFaint, fontWeight: 500 }}> ({stats.balls})</span></span>
              </div>
            );
          })}
          {batted.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: theme.textFaint }}>No batting data</div>}
        </Glass>

        {didNotBat.length > 0 && (
          <div style={{ fontSize: 11.5, color: theme.textFaint, marginBottom: 18 }}>
            Did not bat: {didNotBat.join(", ")}
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textDim, marginBottom: 8, letterSpacing: "0.03em" }}>BOWLING</div>
        <Glass theme={theme} style={{ padding: 4, overflow: "hidden" }}>
          {bowlingOrder.filter(p => bowlerStats[p]).map(p => {
            const stats = bowlerStats[p];
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: `1px solid ${theme.hairline}` }}>
                <span style={{ fontSize: 14, color: theme.text, fontWeight: 600, flex: 1 }}>{p}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk", color: theme.text }}>{formatOvers(stats.balls)}-{stats.runs}-{stats.wickets}</span>
              </div>
            );
          })}
          {bowlingOrder.filter(p => bowlerStats[p]).length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: theme.textFaint }}>No bowling data</div>}
        </Glass>
      </div>
    </div>
  );
}

// ---------- Final match-result screen ----------
// Shows the win-margin sentence in standard cricket phrasing, both team
// scores, and lets the scorer drill into either team's full scorecard.
function MatchResultScreen({ m, result, theme, color }) {
  const [viewingInnings, setViewingInnings] = useState(null); // 'first' | 'second' | null

  const firstInnings = m.firstInningsSummary;
  const secondInnings = summarizeInnings(m, m.a.name, m.b.name);
  // second innings didn't freeze players/dismissed under the same keys as
  // the live match draft — summarizeInnings reads straight off `m` since
  // the 2nd innings IS the live draft at this point.

  const winnerName = result.winner === "first" ? firstInnings.teamName : result.winner === "second" ? secondInnings.teamName : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, zIndex: 160, overflowY: "auto", animation: "fadeIn 0.25s ease" }}>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Trophy size={30} color={color} />
        </div>

        {result.winner === "tie" ? (
          <h1 style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 700, color: theme.text, margin: "0 0 8px", textAlign: "center" }}>Match tied</h1>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textFaint, letterSpacing: "0.04em", marginBottom: 6 }}>MATCH COMPLETE</div>
            <h1 style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 700, color: theme.text, margin: "0 0 8px", textAlign: "center" }}>{winnerName} won</h1>
            <p style={{ fontSize: 15, fontWeight: 600, color: color, margin: "0 0 32px", textAlign: "center" }}>{result.summary}</p>
          </>
        )}

        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => setViewingInnings("first")} className="press" style={{ width: "100%", textAlign: "left", cursor: "pointer" }}>
            <Glass theme={theme} style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textDim, marginBottom: 4 }}>{firstInnings.teamName} · 1st innings</div>
                  <div style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: theme.text }}>{firstInnings.runs}/{firstInnings.wickets} <span style={{ fontSize: 12, color: theme.textFaint, fontWeight: 500 }}>({firstInnings.overs} ov)</span></div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color, fontWeight: 600 }}><Eye size={12} /> Scorecard</span>
              </div>
            </Glass>
          </button>

          <button onClick={() => setViewingInnings("second")} className="press" style={{ width: "100%", textAlign: "left", cursor: "pointer" }}>
            <Glass theme={theme} style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textDim, marginBottom: 4 }}>{secondInnings.teamName} · 2nd innings</div>
                  <div style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: theme.text }}>{secondInnings.runs}/{secondInnings.wickets} <span style={{ fontSize: 12, color: theme.textFaint, fontWeight: 500 }}>({secondInnings.overs} ov)</span></div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color, fontWeight: 600 }}><Eye size={12} /> Scorecard</span>
              </div>
            </Glass>
          </button>
        </div>
      </div>

      {viewingInnings === "first" && (
        <InningsScorecardPanel innings={firstInnings} onClose={() => setViewingInnings(null)} theme={theme} color={color} title="1st Innings" />
      )}
      {viewingInnings === "second" && (
        <InningsScorecardPanel innings={secondInnings} onClose={() => setViewingInnings(null)} theme={theme} color={color} title="2nd Innings" />
      )}
    </div>
  );
}


function CricketMatchSettings({ overLimit, onSave, onClose, theme, color }) {
  const [val, setVal] = useState(overLimit || 20);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 110 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: theme.surface, borderTop: theme.inputBorder, borderRadius: "24px 24px 0 0", padding: "10px 20px 28px" }}>
        <div style={{ width: 36, height: 4, background: theme.chipBg, borderRadius: 2, margin: "0 auto 18px" }} />
        <h3 style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: theme.text }}>Match settings</h3>
        <label style={labelStyle(theme)}>Overs per innings</label>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <button onClick={() => setVal(v => Math.max(1, v - 1))} className="press" style={{ ...scoreBtn(theme), width: 38, height: 38, fontSize: 18 }}>−</button>
          <span style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, width: 40, textAlign: "center", color: theme.text }}>{val}</span>
          <button onClick={() => setVal(v => Math.min(50, v + 1))} className="press" style={{ ...scoreBtn(theme), width: 38, height: 38, fontSize: 18, background: color, color: "#0A0E12", borderColor: color }}>+</button>
        </div>
        <button onClick={() => { onSave(val); onClose(); }} className="press" style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", background: color, color: "#0A0E12", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Save</button>
      </div>
    </div>
  );
}

function PlayerSlot({ label, value, onClick, accent, highlight, theme, disabled, required }) {
  const needsAttention = required && !disabled;
  return (
    <button onClick={onClick} disabled={disabled} className="press" style={{
      flex: 1, padding: "8px 6px", borderRadius: 12, cursor: disabled ? "default" : "pointer", textAlign: "center",
      border: `1px solid ${needsAttention ? "rgba(255,184,0,0.5)" : highlight && value ? accent + "50" : theme.inputBorderColor}`,
      background: needsAttention ? "rgba(255,184,0,0.1)" : highlight && value ? accent + "12" : theme.inputBg,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 8.5, fontWeight: 700, color: theme.textFaint, letterSpacing: "0.03em", marginBottom: 3 }}>
        {highlight && <span style={{ fontSize: 9 }}>🏏</span>}{label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: value ? theme.text : needsAttention ? "#FFC933" : theme.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value || "Select"}
      </div>
    </button>
  );
}

function PlayerPicker({ role, squad, dismissed, current, excludeSelected, onPick, onClose, theme }) {
  const label = role === "striker" ? "Select striker" : role === "nonStriker" ? "Select non-striker" : "Select bowler";
  // A player already batting at the other end can't also be picked here —
  // two roles, one person on the field at a time.
  const available = squad.filter(p => !dismissed.includes(p) && p !== excludeSelected);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 110 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: theme.surface, borderTop: theme.inputBorder, borderRadius: "24px 24px 0 0", padding: "10px 20px 28px", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: theme.chipBg, borderRadius: 2, margin: "0 auto 18px" }} />
        <h3 style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, margin: "0 0 14px", color: theme.text }}>{label}</h3>
        {available.length === 0 && <div style={{ fontSize: 13, color: theme.textFaint }}>No players available. Add players in Squads.</div>}
        {available.map(p => (
          <button key={p} onClick={() => onPick(p)} className="press" style={{
            width: "100%", textAlign: "left", padding: "13px 14px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
            border: `1px solid ${current === p ? "rgba(61,220,151,0.4)" : theme.hairline}`,
            background: current === p ? "rgba(61,220,151,0.1)" : theme.inputBg,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{p}</span>
            {current === p && <Check size={15} color="#3DDC97" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function OversPanel({ overHistory, currentOver, onClose, color, theme }) {
  const allOvers = [...overHistory, ...(currentOver.length ? [currentOver] : [])];
  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, zIndex: 120, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: theme.dark ? "rgba(10,14,18,0.92)" : "rgba(244,246,248,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.hairline}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <button onClick={onClose} className="press" style={ghostBtn(theme)}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0, color: theme.text }}>Over-by-over</h2>
      </div>
      <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
        {allOvers.length === 0 && <div style={{ fontSize: 13, color: theme.textFaint, textAlign: "center", marginTop: 40 }}>No overs bowled yet</div>}
        {allOvers.slice().reverse().map((over, ri) => {
          const overNum = allOvers.length - ri;
          const isCurrent = ri === 0 && over === currentOver && currentOver.length > 0 && currentOver.filter(isLegalDelivery).length < 6;
          return (
            <Glass key={overNum} theme={theme} style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, fontFamily: "Space Grotesk", color }}>{overNum}</div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.textDim }}>Over {overNum}{isCurrent ? " · in progress" : ""}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk", color: theme.text }}>{overRuns(over)} runs</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {over.map((b, i) => {
                  const c = ballChipStyle(b, theme);
                  return <div key={i} style={{ minWidth: 30, height: 30, padding: "0 5px", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, fontSize: 11, fontWeight: 700, fontFamily: "Space Grotesk" }}>{displayBall(b)}</div>;
                })}
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

function PlayersPanel({ m, battingSquad, bowlingSquad, dismissed, striker, nonStriker, yetToBat, batterStats, bowlerStats, onClose, theme }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, zIndex: 120, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: theme.dark ? "rgba(10,14,18,0.92)" : "rgba(244,246,248,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.hairline}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <button onClick={onClose} className="press" style={ghostBtn(theme)}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0, color: theme.text }}>Players</h2>
      </div>
      <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textDim, marginBottom: 8, letterSpacing: "0.03em" }}>{m.a.name.toUpperCase()} · BATTING</div>
        <Glass theme={theme} style={{ padding: 4, marginBottom: 18, overflow: "hidden" }}>
          {[striker, nonStriker].filter(Boolean).map((p) => {
            const stats = batterStats[p];
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: `1px solid ${theme.hairline}` }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: "#3DDC97" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: theme.text, flex: 1 }}>{p}</span>
                {stats && <span style={{ fontSize: 11.5, color: theme.textFaint, marginRight: 6, fontFamily: "Space Grotesk" }}>{stats.runs} ({stats.balls})</span>}
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#3DDC97" }}>{p === striker ? "ON STRIKE" : "BATTING"}</span>
              </div>
            );
          })}
          {yetToBat.map(p => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: `1px solid ${theme.hairline}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: theme.chipBg }} />
              <span style={{ fontSize: 14, color: theme.textDim, flex: 1 }}>{p}</span>
              <span style={{ fontSize: 10.5, color: theme.textFaint }}>YET TO BAT</span>
            </div>
          ))}
          {dismissed.map(p => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: `1px solid ${theme.hairline}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#FF4655" }} />
              <span style={{ fontSize: 14, color: theme.textFaint, flex: 1, textDecoration: "line-through" }}>{p}</span>
              {batterStats[p] && <span style={{ fontSize: 11.5, color: theme.textFaint, marginRight: 6, fontFamily: "Space Grotesk" }}>{batterStats[p].runs} ({batterStats[p].balls})</span>}
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#FF6B78" }}>OUT</span>
            </div>
          ))}
          {battingSquad.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: theme.textFaint }}>No players added yet</div>}
        </Glass>

        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textDim, marginBottom: 8, letterSpacing: "0.03em" }}>{m.b.name.toUpperCase()} · BOWLING</div>
        <Glass theme={theme} style={{ padding: 4, overflow: "hidden" }}>
          {bowlingSquad.map(p => {
            const stats = bowlerStats[p];
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderBottom: `1px solid ${theme.hairline}` }}>
                <span style={{ fontSize: 14, color: p === m.bowler ? theme.text : theme.textDim, fontWeight: p === m.bowler ? 600 : 400, flex: 1 }}>{p}</span>
                {stats && <span style={{ fontSize: 11.5, color: theme.textFaint, marginRight: 6, fontFamily: "Space Grotesk" }}>{formatOvers(stats.balls)}-{stats.runs}-{stats.wickets}</span>}
                {p === m.bowler && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4EC5FF" }}>BOWLING</span>}
              </div>
            );
          })}
          {bowlingSquad.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: theme.textFaint }}>No players added yet</div>}
        </Glass>
      </div>
    </div>
  );
}

// ============================================================
// SOCCER SCORER
// ============================================================
function SoccerScorer({ m, color, visibility, onUpdate, theme, isDesktop, isOwner }) {
  const [showRoster, setShowRoster] = useState(false);
  const [pendingSide, setPendingSide] = useState(null);
  const events = m.events || [];

  const addEvent = (side, type) => {
    if (!isOwner) return;
    onUpdate(m.id, (draft) => {
      draft.events = [...(draft.events || []), { min: draft.minute || 0, type, team: side, player: "—" }];
      if (type === "goal") draft[side].score = (draft[side].score || 0) + 1;
    });
    setPendingSide(null);
  };
  const eventIcon = (type) => type === "goal" ? "⚽" : type === "yellow" ? "🟨" : type === "red" ? "🟥" : "🔁";

  return (
    <div style={isDesktop ? { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, alignItems: "start" } : undefined}>
      <div>
        <Glass theme={theme} style={{ padding: "28px 20px", position: "relative", overflow: "hidden", marginBottom: 14 }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none", background: `radial-gradient(circle at 50% -10%, ${color}, transparent 60%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, position: "relative" }}>
            {m.status === "live" ? <LivePill /> : <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 700 }}>{m.detail}</span>}
            <button onClick={() => setShowRoster(true)} className="press" style={{ ...ghostBtn(theme), padding: "5px 10px" }}><Users size={13} /><span style={{ fontSize: 11.5 }}>Squads</span></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.chipBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: theme.textDim }}>{m.a.short}</div>
              <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 8 }}>{m.a.name}</div>
              <FlipNumber value={m.a.score} size={44} color={theme.text} />
            </div>
            <div style={{ fontFamily: "Space Grotesk", fontSize: 13, color: theme.textFaint, fontWeight: 700, padding: "0 8px" }}>VS</div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.chipBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: theme.textDim }}>{m.b.short}</div>
              <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 8 }}>{m.b.name}</div>
              <FlipNumber value={m.b.score} size={44} color={theme.text} />
            </div>
          </div>
          {typeof m.minute === "number" && (
            <div style={{ marginTop: 24, position: "relative" }}>
              <div style={{ height: 3, background: theme.chipBg, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (m.minute / 90) * 100)}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: theme.textFaint }}>{m.minute}' · {m.detail}</div>
            </div>
          )}
        </Glass>

        {!isDesktop && (
          <Glass theme={theme} style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 10 }}>Timeline</div>
            {events.length === 0 && <div style={{ fontSize: 12.5, color: theme.textFaint }}>No events yet</div>}
            {events.slice().reverse().map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < events.length - 1 ? `1px solid ${theme.hairline}` : "none" }}>
                <span style={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 700, color: theme.textFaint, width: 28 }}>{e.min}'</span>
                <span style={{ fontSize: 15 }}>{eventIcon(e.type)}</span>
                <span style={{ fontSize: 13, color: theme.text, flex: 1 }}>{e.player}</span>
                <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600 }}>{m[e.team].short}</span>
              </div>
            ))}
          </Glass>
        )}
      </div>

      <div>
        {isOwner && (
          <Glass theme={theme} style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 12 }}>Log an event</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["a", "b"].map(side => (
                <button key={side} onClick={() => setPendingSide(pendingSide === side ? null : side)} className="press" style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                  border: `1.5px solid ${pendingSide === side ? color : theme.inputBorderColor}`,
                  background: pendingSide === side ? `${color}18` : theme.inputBg,
                  color: pendingSide === side ? color : theme.textDim,
                }}>{m[side].short}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "goal")} className="press" style={eventBtn(!pendingSide, theme, "#3DDC97")}>⚽ Goal</button>
              <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "yellow")} className="press" style={eventBtn(!pendingSide, theme, "#FFD34E")}>🟨 Yellow card</button>
              <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "red")} className="press" style={eventBtn(!pendingSide, theme, "#FF6B78")}>🟥 Red card</button>
              <button disabled={!pendingSide} onClick={() => addEvent(pendingSide, "sub")} className="press" style={eventBtn(!pendingSide, theme, "#4EC5FF")}>🔁 Substitution</button>
            </div>
            {!pendingSide && <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 10, textAlign: "center" }}>Select a team above first</div>}
          </Glass>
        )}

        {isDesktop && (
          <Glass theme={theme} style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 10 }}>Timeline</div>
            {events.length === 0 && <div style={{ fontSize: 12.5, color: theme.textFaint }}>No events yet</div>}
            {events.slice().reverse().map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < events.length - 1 ? `1px solid ${theme.hairline}` : "none" }}>
                <span style={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 700, color: theme.textFaint, width: 28 }}>{e.min}'</span>
                <span style={{ fontSize: 15 }}>{eventIcon(e.type)}</span>
                <span style={{ fontSize: 13, color: theme.text, flex: 1 }}>{e.player}</span>
                <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600 }}>{m[e.team].short}</span>
              </div>
            ))}
          </Glass>
        )}
      </div>

      {showRoster && <RosterModal m={m} onClose={() => setShowRoster(false)} theme={theme} />}
    </div>
  );
}

function eventBtn(disabled, theme, accent) {
  return { padding: "12px 0", borderRadius: 13, border: theme.inputBorder, background: disabled ? theme.inputBg : `${accent}14`, color: disabled ? theme.textFaint : accent, fontSize: 12.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer" };
}

function RosterModal({ m, onClose, theme }) {
  const players = m.players || { a: [], b: [] };
  const captains = m.captains || {};
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: theme.surface, borderTop: theme.inputBorder, borderRadius: "24px 24px 0 0", padding: "10px 20px 28px", maxHeight: "75vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: theme.chipBg, borderRadius: 2, margin: "0 auto 20px" }} />
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, margin: "0 0 16px", color: theme.text }}>Squads</h2>
        <div style={{ display: "flex", gap: 16 }}>
          {["a", "b"].map(s => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.textDim, marginBottom: 8 }}>{m[s].name}</div>
              {(players[s] || []).length === 0 && <div style={{ fontSize: 12, color: theme.textFaint }}>No players added</div>}
              {(players[s] || []).map((p, i) => (
                <div key={i} style={{ fontSize: 13.5, color: theme.text, padding: "6px 0", borderBottom: `1px solid ${theme.hairline}`, display: "flex", alignItems: "center", gap: 6 }}>
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
// CREATE MATCH — multi-step wizard, fully validated
// ============================================================
function CreateMatch({ onClose, onCreate, theme }) {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState("soccer");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [visibility, setVisibility] = useState("private");

  const [countA, setCountA] = useState(6);
  const [countB, setCountB] = useState(6);
  const [playersA, setPlayersA] = useState(Array(6).fill(""));
  const [playersB, setPlayersB] = useState(Array(6).fill(""));
  const [captainA, setCaptainA] = useState(null);
  const [captainB, setCaptainB] = useState(null);
  const [overLimit, setOverLimit] = useState(20);

  const [tossWinner, setTossWinner] = useState(null);
  const [tossDecision, setTossDecision] = useState(null);

  const [attemptedNext, setAttemptedNext] = useState(false);

  const sports = ["soccer", "cricket", "badminton", "volleyball"];
  const needsToss = sport === "cricket";

  // Growing/shrinking the player count adds or removes a SLOT at the end,
  // it never resets or renumbers the names already typed in other slots.
  const growShrinkA = (newCount) => {
    setCountA(newCount);
    setPlayersA(prev => {
      const next = [...prev];
      while (next.length < newCount) next.push("");
      while (next.length > newCount) next.pop();
      return next;
    });
  };
  const growShrinkB = (newCount) => {
    setCountB(newCount);
    setPlayersB(prev => {
      const next = [...prev];
      while (next.length < newCount) next.push("");
      while (next.length > newCount) next.pop();
      return next;
    });
  };

  const step1Valid = teamA.trim().length > 0 && teamB.trim().length > 0;
  const filledA = playersA.filter(p => p.trim().length > 0);
  const filledB = playersB.filter(p => p.trim().length > 0);
  const step2Valid = filledA.length === countA && filledB.length === countB && !!captainA && !!captainB;
  const step3Valid = !needsToss || (!!tossWinner && !!tossDecision);

  const goNext = () => {
    setAttemptedNext(true);
    if (step === 1 && step1Valid) { setStep(2); setAttemptedNext(false); }
    else if (step === 2 && step2Valid) { setStep(needsToss ? 3 : 4); setAttemptedNext(false); }
    else if (step === 3 && step3Valid) { setStep(4); setAttemptedNext(false); }
  };
  const goBack = () => {
    setAttemptedNext(false);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(needsToss ? 3 : 2);
  };

  const finalize = () => {
    onCreate({
      sport, teamA, teamB, visibility, playersA: filledA, playersB: filledB, captainA, captainB,
      overLimit: needsToss ? overLimit : undefined,
      toss: needsToss ? { winner: tossWinner, decision: tossDecision } : null,
    });
  };

  const stepLabel = ["", "Match details", "Squads & captains", "Toss", "Review"][step];
  const totalSteps = needsToss ? 4 : 3;
  const stepIndex = needsToss ? step : (step === 4 ? 3 : step);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,10,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: theme.surface, borderTop: theme.inputBorder, borderRadius: "24px 24px 0 0", padding: "10px 20px 28px", animation: "slideUpSheet 0.3s cubic-bezier(.16,1,.3,1)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: theme.chipBg, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.textFaint, letterSpacing: "0.03em" }}>STEP {stepIndex} OF {totalSteps}</span>
          <button onClick={onClose} className="press" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={theme.textFaint} /></button>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < stepIndex ? SPORT_COLOR[sport] : theme.chipBg, transition: "background 0.3s ease" }} />
          ))}
        </div>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 21, fontWeight: 700, color: theme.text, margin: "0 0 18px" }}>{stepLabel}</h2>

        {step === 1 && <StepMatchDetails sport={sport} setSport={setSport} teamA={teamA} setTeamA={setTeamA} teamB={teamB} setTeamB={setTeamB} visibility={visibility} setVisibility={setVisibility} sports={sports} theme={theme} showErrors={attemptedNext && !step1Valid} />}
        {step === 2 && (
          <StepSquads
            teamA={teamA} teamB={teamB} color={SPORT_COLOR[sport]} theme={theme}
            countA={countA} setCountA={growShrinkA} countB={countB} setCountB={growShrinkB}
            playersA={playersA} setPlayersA={setPlayersA} playersB={playersB} setPlayersB={setPlayersB}
            captainA={captainA} setCaptainA={setCaptainA} captainB={captainB} setCaptainB={setCaptainB}
            showErrors={attemptedNext && !step2Valid}
          />
        )}
        {step === 3 && needsToss && (
          <StepToss teamA={teamA} teamB={teamB} color={SPORT_COLOR[sport]} tossWinner={tossWinner} setTossWinner={setTossWinner} tossDecision={tossDecision} setTossDecision={setTossDecision} theme={theme} showErrors={attemptedNext && !step3Valid} overLimit={overLimit} setOverLimit={setOverLimit} />
        )}
        {step === 4 && <StepReview sport={sport} teamA={teamA} teamB={teamB} visibility={visibility} playersA={filledA} playersB={filledB} captainA={captainA} captainB={captainB} tossWinner={tossWinner} tossDecision={tossDecision} needsToss={needsToss} theme={theme} overLimit={overLimit} />}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {step > 1 && <button onClick={goBack} className="press" style={{ ...ghostBtn(theme), padding: "13px 20px", fontSize: 14 }}><ChevronLeft size={16} />Back</button>}
          {step < 4 ? (
            <button onClick={goNext} className="press" style={{ flex: 1, padding: "14px 0", borderRadius: 16, border: "none", background: SPORT_COLOR[sport], color: "#0A0E12", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Next</button>
          ) : (
            <button onClick={finalize} className="press" style={{ flex: 1, padding: "14px 0", borderRadius: 16, border: "none", background: SPORT_COLOR[sport], color: "#0A0E12", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Start match</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorNote({ show, text, theme }) {
  if (!show) return null;
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#FF6B78", marginTop: -8, marginBottom: 14 }}><AlertCircle size={12} />{text}</div>;
}

// Single sport tile — deliberately its own component so the "selected"
// look is derived from nothing but `isSelected`, with no way for stale
// closures or leftover hover/focus state to make two tiles look chosen
// at once.
function SportTile({ sport, isSelected, onSelect, theme }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(sport)}
      className="press sport-tile"
      style={{
        padding: "12px 4px", borderRadius: 14, cursor: "pointer",
        border: `1.5px solid ${isSelected ? SPORT_COLOR[sport] : theme.inputBorderColor}`,
        background: isSelected ? `${SPORT_COLOR[sport]}18` : theme.inputBg,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        transition: "border-color 0.12s ease, background-color 0.12s ease",
      }}
    >
      <span style={{ fontSize: 20 }}>{SPORT_ICON[sport]}</span>
      <span style={{ fontSize: 10.5, color: isSelected ? SPORT_COLOR[sport] : theme.textDim, fontWeight: 600, textTransform: "capitalize" }}>{sport}</span>
    </button>
  );
}

function StepMatchDetails({ sport, setSport, teamA, setTeamA, teamB, setTeamB, visibility, setVisibility, sports, theme, showErrors }) {
  return (
    <>
      <label style={labelStyle(theme)}>Sport</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {sports.map(s => (
          <SportTile key={s} sport={s} isSelected={sport === s} onSelect={setSport} theme={theme} />
        ))}
      </div>
      <label style={labelStyle(theme)}>Team / Player A <span style={{ color: "#FF6B78" }}>*</span></label>
      <input value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="e.g. Riverside FC" style={inputStyle(theme, showErrors && !teamA.trim())} />
      <label style={labelStyle(theme)}>Team / Player B <span style={{ color: "#FF6B78" }}>*</span></label>
      <input value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="e.g. Ashford United" style={inputStyle(theme, showErrors && !teamB.trim())} />
      <ErrorNote show={showErrors} text="Both team names are required." theme={theme} />
      <label style={labelStyle(theme)}>Visibility</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {["private", "public"].map(v => (
          <button key={v} onClick={() => setVisibility(v)} className="press" style={{ flex: 1, padding: "12px 0", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1.5px solid ${visibility === v ? "#3DDC97" : theme.inputBorderColor}`, background: visibility === v ? "rgba(61,220,151,0.1)" : theme.inputBg, color: visibility === v ? "#3DDC97" : theme.textDim, fontWeight: 600, fontSize: 13.5, textTransform: "capitalize" }}>{v === "public" ? <Globe size={14} /> : <Lock size={14} />} {v}</button>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 0, lineHeight: 1.5 }}>{visibility === "public" ? "Anyone on the platform can find and watch this match live." : "Only people with the match link can watch."}</p>
    </>
  );
}

// StepSquads: player-slot rows are their own component so React can key
// each input by a stable slot id — this is what makes typing work
// correctly across re-renders (no remount-per-keystroke).
function PlayerSlotRow({ index, value, onChange, isCaptain, onToggleCaptain, theme, showError }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: theme.textFaint, width: 18, fontFamily: "Space Grotesk", fontWeight: 700 }}>{index + 1}</span>
      <input
        value={value}
        onChange={e => onChange(index, e.target.value)}
        placeholder={`Player ${index + 1} name`}
        style={{ ...inputStyle(theme, showError && !value.trim()), marginBottom: 0, flex: 1 }}
      />
      <button
        onClick={() => onToggleCaptain(value)}
        disabled={!value}
        className="press"
        style={{
          width: 38, height: 46, borderRadius: 12,
          border: `1px solid ${isCaptain ? "rgba(255,184,0,0.4)" : theme.inputBorderColor}`,
          background: isCaptain ? "rgba(255,184,0,0.14)" : theme.inputBg,
          cursor: value ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Star size={15} color={isCaptain ? "#FFC933" : theme.textFaint} fill={isCaptain ? "#FFC933" : "none"} />
      </button>
    </div>
  );
}

function StepSquads({ teamA, teamB, color, theme, countA, setCountA, countB, setCountB, playersA, setPlayersA, playersB, setPlayersB, captainA, setCaptainA, captainB, setCaptainB, showErrors }) {
  const [teamSide, setTeamSide] = useState("a");
  const isA = teamSide === "a";
  const count = isA ? countA : countB;
  const setCount = isA ? setCountA : setCountB;
  const players = isA ? playersA : playersB;
  const setPlayers = isA ? setPlayersA : setPlayersB;
  const captain = isA ? captainA : captainB;
  const setCaptain = isA ? setCaptainA : setCaptainB;

  const updateName = useCallback((i, name) => {
    setPlayers(prev => { const next = [...prev]; next[i] = name; return next; });
  }, [setPlayers]);

  const toggleCaptain = useCallback((name) => {
    setCaptain(prev => (name && prev === name ? null : name));
  }, [setCaptain]);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["a", "b"].map(s => {
          const name = s === "a" ? teamA : teamB;
          const incomplete = s === "a" ? (playersA.filter(p => p.trim()).length !== countA || !captainA) : (playersB.filter(p => p.trim()).length !== countB || !captainB);
          return (
            <button key={s} onClick={() => setTeamSide(s)} className="press" style={{ flex: 1, padding: "11px 0", borderRadius: 13, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: `1.5px solid ${teamSide === s ? color : theme.inputBorderColor}`, background: teamSide === s ? `${color}18` : theme.inputBg, color: teamSide === s ? color : theme.textDim, position: "relative" }}>
              {name || (s === "a" ? "Team A" : "Team B")}
              {showErrors && incomplete && <span style={{ position: "absolute", top: 6, right: 8, width: 6, height: 6, borderRadius: 999, background: "#FF6B78" }} />}
            </button>
          );
        })}
      </div>

      <label style={labelStyle(theme)}>Number of players</label>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button onClick={() => setCount(Math.max(1, count - 1))} className="press" style={{ ...scoreBtn(theme), width: 38, height: 38, fontSize: 18 }}>−</button>
        <span style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, width: 34, textAlign: "center", color: theme.text }}>{count}</span>
        <button onClick={() => setCount(Math.min(15, count + 1))} className="press" style={{ ...scoreBtn(theme), width: 38, height: 38, fontSize: 18, background: color, color: "#0A0E12", borderColor: color }}>+</button>
        <span style={{ fontSize: 11.5, color: theme.textFaint }}>Adding/removing adjusts the slots below</span>
      </div>

      <label style={labelStyle(theme)}>Player names — tap ⭐ to set captain <span style={{ color: "#FF6B78" }}>*</span></label>
      <div style={{ marginBottom: 4 }}>
        {players.map((p, i) => (
          <PlayerSlotRow
            key={i}
            index={i}
            value={p}
            onChange={updateName}
            isCaptain={!!captain && captain === p}
            onToggleCaptain={toggleCaptain}
            theme={theme}
            showError={showErrors}
          />
        ))}
      </div>
      <ErrorNote show={showErrors} text={`All ${count} player names and a captain are required for ${isA ? teamA || "Team A" : teamB || "Team B"}.`} theme={theme} />
      <p style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 8, lineHeight: 1.5 }}>Switch teams above to set up the other squad. Every player slot and a captain must be filled for both teams.</p>
    </>
  );
}

function StepToss({ teamA, teamB, color, tossWinner, setTossWinner, tossDecision, setTossDecision, theme, showErrors, overLimit, setOverLimit }) {
  return (
    <>
      <label style={labelStyle(theme)}>Who won the toss? <span style={{ color: "#FF6B78" }}>*</span></label>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["a", teamA], ["b", teamB]].map(([s, name]) => (
          <button key={s} onClick={() => setTossWinner(s)} className="press" style={{ flex: 1, padding: "16px 8px", borderRadius: 14, cursor: "pointer", border: `1.5px solid ${tossWinner === s ? color : theme.inputBorderColor}`, background: tossWinner === s ? `${color}18` : theme.inputBg, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Coins size={18} color={tossWinner === s ? color : theme.textFaint} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: tossWinner === s ? color : theme.textDim }}>{name}</span>
          </button>
        ))}
      </div>

      <label style={labelStyle(theme)}>What did they choose? <span style={{ color: "#FF6B78" }}>*</span></label>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["bat", "bowl"].map(d => (
          <button key={d} disabled={!tossWinner} onClick={() => setTossDecision(d)} className="press" style={{ flex: 1, padding: "14px 0", borderRadius: 14, cursor: tossWinner ? "pointer" : "not-allowed", border: `1.5px solid ${tossDecision === d ? color : theme.inputBorderColor}`, background: tossDecision === d ? `${color}18` : theme.inputBg, color: !tossWinner ? theme.textFaint : tossDecision === d ? color : theme.textDim, fontWeight: 700, fontSize: 13.5, textTransform: "capitalize" }}>{d} first</button>
        ))}
      </div>
      <ErrorNote show={showErrors} text="Select who won the toss and what they chose." theme={theme} />
      {!tossWinner && !showErrors && <p style={{ fontSize: 11.5, color: theme.textFaint, marginTop: -12, marginBottom: 20 }}>Select the toss winner first.</p>}

      <label style={labelStyle(theme)}>Overs per innings</label>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => setOverLimit(Math.max(1, overLimit - 1))} className="press" style={{ ...scoreBtn(theme), width: 38, height: 38, fontSize: 18 }}>−</button>
        <span style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, width: 40, textAlign: "center", color: theme.text }}>{overLimit}</span>
        <button onClick={() => setOverLimit(Math.min(50, overLimit + 1))} className="press" style={{ ...scoreBtn(theme), width: 38, height: 38, fontSize: 18, background: color, color: "#0A0E12", borderColor: color }}>+</button>
      </div>
      <p style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 10, lineHeight: 1.5 }}>You can change this later from the ⚙ settings icon in the cricket scoring screen.</p>
    </>
  );
}

function StepReview({ sport, teamA, teamB, visibility, playersA, playersB, captainA, captainB, tossWinner, tossDecision, needsToss, theme, overLimit }) {
  return (
    <div>
      <Glass theme={theme} style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>{SPORT_ICON[sport]}</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "Space Grotesk", color: theme.text }}>{teamA} vs {teamB}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.textDim, flexWrap: "wrap" }}>
          {visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
          <span style={{ textTransform: "capitalize" }}>{visibility}</span><span style={{ margin: "0 4px" }}>·</span><span>{playersA.length + playersB.length} players added</span>
          {needsToss && <><span style={{ margin: "0 4px" }}>·</span><span>{overLimit} overs</span></>}
        </div>
      </Glass>
      {needsToss && tossWinner && (
        <Glass theme={theme} style={{ padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <Coins size={16} color="#FFC933" />
          <span style={{ fontSize: 13, color: theme.text }}><b>{tossWinner === "a" ? teamA : teamB}</b> won the toss, chose to <b style={{ textTransform: "capitalize" }}>{tossDecision || "…"}</b></span>
        </Glass>
      )}
      <div style={{ display: "flex", gap: 14 }}>
        {[[teamA, playersA, captainA], [teamB, playersB, captainB]].map(([name, list, cap], idx) => (
          <div key={idx} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textDim, marginBottom: 8 }}>{name}</div>
            {list.map(p => (
              <div key={p} style={{ fontSize: 13, color: theme.text, padding: "5px 0", display: "flex", alignItems: "center", gap: 5 }}>{p}{cap === p && <Star size={11} color="#FFC933" fill="#FFC933" />}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PROFILE + SETTINGS (persisted)
// ============================================================
function Profile({ onOpenSettings, onOpenMatches, theme, profile, ownedCount, sportsUsed, publicCount }) {
  const initial = (profile.name || "?")[0].toUpperCase();
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Glass theme={theme} style={{ padding: 22, marginBottom: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none", background: "radial-gradient(circle at 20% 0%, #3DDC97, transparent 55%), radial-gradient(circle at 90% 20%, #4EC5FF, transparent 50%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, fontFamily: "Space Grotesk", color: "#0A0E12", boxShadow: "0 8px 24px -6px rgba(61,220,151,0.4), inset 0 1px 0 rgba(255,255,255,0.3)" }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: theme.text, fontFamily: "Space Grotesk" }}>{profile.name}</div>
            <div style={{ fontSize: 12.5, color: theme.textDim, marginTop: 3 }}>{profile.bio || "Add a bio in settings"}</div>
          </div>
          <button onClick={onOpenSettings} className="press" style={{ width: 36, height: 36, borderRadius: 11, border: theme.inputBorder, background: theme.inputBg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Settings size={16} color={theme.textDim} />
          </button>
        </div>
      </Glass>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <button onClick={onOpenMatches} className="press" style={{ cursor: "pointer", textAlign: "left" }}>
          <Glass theme={theme} style={{ padding: "16px 8px", textAlign: "center" }}>
            <Trophy size={14} color={theme.textFaint} style={{ marginBottom: 6 }} />
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, color: theme.text }}>{ownedCount}</div>
            <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>Matches</div>
          </Glass>
        </button>
        {[[String(sportsUsed), "Sports", Zap], [String(publicCount), "Public", Globe]].map(([n, l, Icon]) => (
          <Glass key={l} theme={theme} style={{ padding: "16px 8px", textAlign: "center" }}>
            <Icon size={14} color={theme.textFaint} style={{ marginBottom: 6 }} />
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, color: theme.text }}>{n}</div>
            <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>{l}</div>
          </Glass>
        ))}
      </div>
    </div>
  );
}

// ---------- Matches list: reached from the profile's "Matches" stat ----------
// Live matches first, then ended ones — per spec. Scheduled/upcoming
// matches the person owns are included too, sorted after live, before ended,
// so nothing the person created goes missing from this one list.
function MatchesPanel({ matches, onOpen, onClose, theme }) {
  const live = matches.filter(m => m.status === "live");
  const upcoming = matches.filter(m => m.status === "scheduled");
  const ended = matches.filter(m => m.status === "final");

  const Section = ({ title, list }) => list.length === 0 ? null : (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.textFaint, letterSpacing: "0.03em", margin: "18px 0 10px" }}>{title}</div>
      {list.map(m => <MatchCard key={m.id} m={m} onOpen={onOpen} theme={theme} isOwner={true} />)}
    </>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, zIndex: 130, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: theme.dark ? "rgba(10,14,18,0.92)" : "rgba(244,246,248,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.hairline}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <button onClick={onClose} className="press" style={ghostBtn(theme)}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0, color: theme.text }}>Your matches</h2>
      </div>
      <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
        {matches.length === 0 && <div style={{ fontSize: 13, color: theme.textFaint, textAlign: "center", marginTop: 40 }}>You haven't created any matches yet.</div>}
        <Section title="LIVE" list={live} />
        <Section title="UPCOMING" list={upcoming} />
        <Section title="ENDED" list={ended} />
      </div>
    </div>
  );
}

// ---------- Settings sub-pieces, hoisted to module scope ----------
// (Previously these were defined INSIDE SettingsPanel's render, which made
// React treat them as new component types on every keystroke and remount
// the input mid-type — that's what caused the "type one letter, tap again"
// bug. Hoisting fixes it: same component identity across renders.)

function SettingsSection({ title, theme, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.textFaint, marginBottom: 8, letterSpacing: "0.04em", padding: "0 4px" }}>{title}</div>
      <Glass theme={theme} style={{ padding: 4, overflow: "hidden" }}>{children}</Glass>
    </div>
  );
}

function SettingsToggleRow({ icon: Icon, label, sub, checked, onChange, last, theme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 12px", borderBottom: last ? "none" : `1px solid ${theme.hairline}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.chipBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color={theme.textDim} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={onChange} className="press" style={{ width: 42, height: 25, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: checked ? "#3DDC97" : theme.chipBg, transition: "background 0.2s ease", flexShrink: 0 }}>
        <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 20 : 3, transition: "left 0.2s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );
}

function SettingsLinkRow({ icon: Icon, label, sub, last, danger, onClick, theme }) {
  return (
    <div className="press" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 12px", borderBottom: last ? "none" : `1px solid ${theme.hairline}`, cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: danger ? "rgba(255,70,85,0.1)" : theme.chipBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color={danger ? "#FF6B78" : theme.textDim} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: danger ? "#FF6B78" : theme.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={16} color={theme.textFaint} />
    </div>
  );
}

// Full-screen edit-profile panel (not a cramped inline dropdown).
function EditProfilePanel({ profile, onSave, onClose, theme }) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);

  const handleSave = () => {
    onSave({ name: name.trim() || "Player", bio: bio.trim() });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, zIndex: 130, overflowY: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ position: "sticky", top: 0, background: theme.dark ? "rgba(10,14,18,0.92)" : "rgba(244,246,248,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.hairline}`, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} className="press" style={ghostBtn(theme)}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
          <h2 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, margin: 0, color: theme.text }}>Edit profile</h2>
        </div>
        <button onClick={handleSave} className="press" style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: "#3DDC97", color: "#0A0E12", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save</button>
      </div>
      <div style={{ padding: 22, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <div style={{ width: 84, height: 84, borderRadius: 24, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, fontFamily: "Space Grotesk", color: "#0A0E12" }}>
            {(name || "?")[0].toUpperCase()}
          </div>
        </div>
        <label style={labelStyle(theme)}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle(theme)} autoFocus />
        <label style={labelStyle(theme)}>Bio</label>
        <input value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. Weekend cricket organiser" style={inputStyle(theme)} />
        <p style={{ fontSize: 11.5, color: theme.textFaint, marginTop: -8, lineHeight: 1.5 }}>Your bio is shown on your profile. Leave it blank if you'd rather not add one.</p>
      </div>
    </div>
  );
}

function SettingsPanel({ onBack, theme, settings, setSettings, profile, setProfile }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k) => setSettings(t => ({ ...t, [k]: !t[k] }));

  const handleProfileSave = (next) => {
    setProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (editingProfile) {
    return <EditProfilePanel profile={profile} onSave={handleProfileSave} onClose={() => setEditingProfile(false)} theme={theme} />;
  }

  return (
    <div style={{ animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} className="press" style={ghostBtn(theme)}><ChevronLeft size={18} /><span style={{ fontSize: 14 }}>Back</span></button>
        <h1 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, margin: 0, color: theme.text }}>Settings</h1>
        {saved && <span style={{ fontSize: 11.5, color: "#3DDC97", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} />Saved</span>}
      </div>

      <SettingsSection title="PREFERENCES" theme={theme}>
        <SettingsToggleRow icon={Bell} label="Notifications" sub="Live score alerts for followed matches" checked={settings.notifications} onChange={() => set("notifications")} theme={theme} />
        <SettingsToggleRow icon={Globe} label="Public by default" sub="New matches start visible to everyone" checked={settings.publicByDefault} onChange={() => set("publicByDefault")} theme={theme} />
        <SettingsToggleRow icon={settings.darkMode ? Moon : Sun} label="Dark mode" sub={settings.darkMode ? "On — easier on the eyes at night" : "Off — bright theme"} checked={settings.darkMode} onChange={() => set("darkMode")} last theme={theme} />
      </SettingsSection>

      <SettingsSection title="ACCOUNT" theme={theme}>
        <SettingsLinkRow icon={User} label="Edit profile" sub={profile.bio ? `${profile.name} · ${profile.bio}` : profile.name} onClick={() => setEditingProfile(true)} theme={theme} />
        <SettingsLinkRow icon={Shield} label="Privacy" sub="Who can find and message you" theme={theme} />
        <SettingsLinkRow icon={Award} label="Organiser tools" sub="Tournament brackets, sponsors" last theme={theme} />
      </SettingsSection>

      <SettingsSection title="SUPPORT" theme={theme}>
        <SettingsLinkRow icon={HelpCircle} label="Help center" theme={theme} />
        <SettingsLinkRow icon={LogOut} label="Log out" danger last theme={theme} />
      </SettingsSection>

      <div style={{ textAlign: "center", fontSize: 11, color: theme.textFaint, marginTop: 20 }}>Scoreline v1.0 · Settings saved to this browser</div>
    </div>
  );
}

// ============================================================
// PWA INSTALL BUTTON
// ============================================================
// Collapsed: just a down-arrow icon. First click expands it to show
// "Download the app" and a moment later fires the native install prompt.
// A small text reminder appears beside it periodically (first visit always,
// then infrequently after) so people notice the feature exists without
// being nagged every single visit.
const NUDGE_INTERVAL_MS = 90 * 1000; // once expanded by auto-nudge, re-check this often during a long session

function InstallButton({ theme, isDesktop }) {
  const [available, setAvailable] = useState(isInstallAvailable());
  const [standalone] = useState(isRunningStandalone());
  const [expanded, setExpanded] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const nudgeTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = onInstallAvailabilityChange(setAvailable);
    return unsubscribe;
  }, []);

  // Decide once per mount whether today's visit should show the reminder
  // text (first-ever visit always shows it; afterwards only occasionally).
  useEffect(() => {
    if (!available || standalone) return;
    if (shouldShowInstallNudge()) {
      setShowReminder(true);
      markInstallNudgeShown();
    }
  }, [available, standalone]);

  // While the reminder is visible, also periodically re-affirm it during a
  // long single session so it isn't just a one-frame flash.
  useEffect(() => {
    if (!showReminder) return;
    nudgeTimer.current = setInterval(() => setShowReminder(true), NUDGE_INTERVAL_MS);
    return () => clearInterval(nudgeTimer.current);
  }, [showReminder]);

  if (!available || standalone) return null;

  const handleArrowClick = () => { setExpanded(true); setShowReminder(false); };

  const handleDownloadClick = async () => {
    await promptInstall();
    setExpanded(false);
  };

  const handleCollapse = (e) => {
    e.stopPropagation();
    setExpanded(false);
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
      {showReminder && !expanded && (
        <span style={{
          fontSize: 11.5, fontWeight: 600, color: theme.textDim, whiteSpace: "nowrap",
          animation: "fadeIn 0.3s ease",
        }}>
          Get the app for a better experience
        </span>
      )}
      {!expanded ? (
        <button
          onClick={handleArrowClick}
          className="press"
          title="Install Scoreline"
          style={{
            width: isDesktop ? 36 : 32, height: isDesktop ? 36 : 32, borderRadius: 11,
            border: theme.inputBorder, background: theme.inputBg,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
        >
          <Download size={isDesktop ? 16 : 15} color={theme.textDim} />
        </button>
      ) : (
        <div
          className="press"
          style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            padding: "8px 8px 8px 12px", borderRadius: 999,
            border: "1px solid rgba(61,220,151,0.4)", background: "rgba(61,220,151,0.12)",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={handleDownloadClick}
        >
          <Smartphone size={14} color="#3DDC97" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#3DDC97", whiteSpace: "nowrap" }}>Download the app</span>
          <button onClick={handleCollapse} className="press" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
            <X size={13} color="#3DDC97" />
          </button>
        </div>
      )}
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
  const deviceId = useRef(getDeviceId()).current;
  const [matches, setMatches] = useState(() => loadMatches(buildSeedMatches()));
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMatchesPanel, setShowMatchesPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 900 : true);
  const [isWide, setIsWide] = useState(typeof window !== "undefined" ? window.innerWidth >= 1280 : false);

  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState(loadProfile);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveProfile(profile), [profile]);
  useEffect(() => saveMatches(matches), [matches]);

  const theme = useTheme(settings.darkMode);

  useEffect(() => {
    const onResize = () => { setIsDesktop(window.innerWidth >= 900); setIsWide(window.innerWidth >= 1280); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // simulate the one demo soccer match ticking, just for a lively feed —
  // harmless no-op once a real backend drives this.
  useEffect(() => {
    const t = setInterval(() => {
      setMatches(prev => prev.map(m => (m.id === "m1" && m.status === "live" && m.minute < 90) ? { ...m, minute: m.minute + 1 } : m));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const updateMatch = useCallback((id, mutator) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== id) return m;
      const draft = JSON.parse(JSON.stringify(m));
      mutator(draft);
      return draft;
    }));
  }, []);

  const activeMatch = matches.find(m => m.id === activeMatchId) || null;
  // Stabilized with useCallback: this is passed as the onOpen prop to every
  // memoized MatchCard/UpcomingCard in the feed. A fresh function reference
  // on every render would make React.memo's prop comparison always see
  // "changed" and re-render every card anyway, silently defeating the
  // memoization above.
  const openMatch = useCallback((m) => setActiveMatchId(m.id), []);
  const isOwnerOf = useCallback((m) => m.ownerId === deviceId, [deviceId]);

  const showToast = useCallback((message, accent) => {
    setToast({ message, accent, key: Date.now() });
  }, []);

  const handleCreate = ({ sport, teamA, teamB, visibility, playersA, playersB, captainA, captainB, toss, overLimit }) => {
    const id = "m" + Date.now();
    const isCricket = sport === "cricket";
    const battingFirst = isCricket && toss ? (toss.decision === "bat" ? toss.winner : (toss.winner === "a" ? "b" : "a")) : "a";

    const newMatch = {
      id, sport, status: "live", visibility: settings.publicByDefault ? "public" : visibility,
      ownerId: deviceId,
      a: { name: teamA, short: teamA.slice(0, 3).toUpperCase(), score: isCricket ? "0/0" : 0, runs: 0, wickets: 0, ballsBowled: 0, overs: "0.0", sets: (sport === "badminton" || sport === "volleyball") ? [] : undefined },
      b: { name: teamB, short: teamB.slice(0, 3).toUpperCase(), score: isCricket ? "—" : 0, sets: (sport === "badminton" || sport === "volleyball") ? [] : undefined },
      minute: sport === "soccer" ? 0 : null, detail: isCricket && toss ? `${toss.winner === "a" ? teamA : teamB} won the toss, chose to ${toss.decision}` : "Just started",
      overLimit: isCricket ? overLimit : undefined,
      balls: [], overHistory: [], events: [], batterStats: {}, bowlerStats: {},
      players: { a: playersA, b: playersB },
      captains: { a: captainA, b: captainB },
      dismissed: [],
      toss: toss || null,
      // Openers are NOT auto-picked: the scorer must explicitly choose both
      // striker and non-striker before the first ball can be scored.
      striker: null,
      nonStriker: null,
      bowler: null,
      innings: 1,
      inningsComplete: false,
      completionReason: null,
    };
    if (isCricket && battingFirst === "b") {
      const tmp = newMatch.a; newMatch.a = { ...newMatch.b, score: "0/0", runs: 0, wickets: 0, ballsBowled: 0, overs: "0.0" }; newMatch.b = { ...tmp, score: "—" };
      const tmpP = newMatch.players.a; newMatch.players.a = newMatch.players.b; newMatch.players.b = tmpP;
      const tmpC = newMatch.captains.a; newMatch.captains.a = newMatch.captains.b; newMatch.captains.b = tmpC;
    }

    setMatches(prev => [newMatch, ...prev]);
    setShowCreate(false);
    setTab("home");
    setActiveMatchId(id);
  };

  const liveMatches = matches.filter(m => m.status === "live");
  const upcomingMatches = matches.filter(m => m.status === "scheduled");
  const finalMatches = matches.filter(m => m.status === "final");
  const ownedMatches = matches.filter(m => m.ownerId === deviceId);
  const sportsUsed = new Set(ownedMatches.map(m => m.sport)).size;
  const publicOwnedCount = ownedMatches.filter(m => m.visibility === "public").length;

  // Desktop content width: a real multi-column feed at wide sizes, not a
  // stretched single mobile column. Sidebar width factors in when collapsed.
  const sidebarWidth = sidebarCollapsed ? 76 : 232;
  const contentMaxWidth = isWide ? 1180 : isDesktop ? 860 : "100%";
  const feedGridStyle = isWide
    ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }
    : isDesktop
      ? { display: "grid", gridTemplateColumns: "1fr", gap: 12 }
      : undefined;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "Inter, sans-serif", display: "flex", transition: "background 0.3s ease, color 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulseDot { 0% { box-shadow: 0 0 0 0 rgba(255,70,85,0.55); } 70% { box-shadow: 0 0 0 7px rgba(255,70,85,0); } 100% { box-shadow: 0 0 0 0 rgba(255,70,85,0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .match-card { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1); }
        .match-card:active { transform: scale(0.98); }
        .press { transition: transform 0.12s cubic-bezier(.34,1.56,.64,1), opacity 0.12s ease; }
        .press:active { transform: scale(0.94); opacity: 0.85; }
        /* will-change is applied only while a press/hover is actually
           happening (below), not globally — reserving a GPU layer for
           every button on screen at once (dozens, on the scoring pad)
           made the compositor do more work than it saved. */
        .press:active, .match-card:active { will-change: transform; }
        @media (min-width: 900px) {
          .match-card:hover { transform: translateY(-2px); will-change: transform; }
          .press:hover { filter: brightness(1.08); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        button { outline: none; border: 0; -webkit-appearance: none; appearance: none; font-family: inherit; }
        button:focus, button:focus-visible, button:active { outline: none; }
        button::-moz-focus-inner { border: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${theme.dark ? "rgba(255,255,255,0.12)" : "rgba(18,24,31,0.15)"}; border-radius: 3px; }
        input:focus { border-color: ${theme.dark ? "rgba(255,255,255,0.3)" : "rgba(18,24,31,0.3)"} !important; }
        input::placeholder { color: ${theme.dark ? "rgba(255,255,255,0.25)" : "rgba(18,24,31,0.3)"}; }
        /* Scroll containers get their own compositing layer up front so the
           browser doesn't have to promote/demote them mid-scroll, and
           momentum scrolling stays native on iOS Safari/WebView. */
        html, body, #root { height: 100%; }
        body { -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
      `}</style>

      {isDesktop && (
        <LiquidGlassShell theme={theme} style={{ width: sidebarWidth, borderRight: `1px solid ${theme.hairline}`, padding: "24px 14px", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", transition: "width 0.22s cubic-bezier(.16,1,.3,1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "space-between", padding: "0 4px", marginBottom: 32, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px -4px rgba(61,220,151,0.5)", flexShrink: 0 }}><Flame size={16} color="#0A0E12" strokeWidth={2.5} /></div>
              {!sidebarCollapsed && <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 17, color: theme.text, whiteSpace: "nowrap" }}>Scoreline</span>}
            </div>
          </div>

          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id && !activeMatch && !showSettings;
            return (
              <button
                key={n.id}
                className="press"
                title={sidebarCollapsed ? n.label : undefined}
                onClick={() => { n.id === "create" ? setShowCreate(true) : (setTab(n.id), setActiveMatchId(null), setShowSettings(false)); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: sidebarCollapsed ? "11px 0" : "11px 12px", marginBottom: 4,
                  borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", position: "relative",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  background: active ? theme.chipBg : "transparent",
                  boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                  color: active ? theme.text : theme.textDim, fontSize: 14.5, fontWeight: 600, width: "100%",
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                {!sidebarCollapsed && n.label}
              </button>
            );
          })}

          <div style={{ marginTop: "auto", position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
            <Glass
              theme={theme}
              onClick={() => { setTab("profile"); setActiveMatchId(null); setShowSettings(true); }}
              style={{ padding: sidebarCollapsed ? 10 : 14, cursor: "pointer" }}
              className="press"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, fontFamily: "Space Grotesk", color: "#0A0E12", flexShrink: 0 }}>{(profile.name || "?")[0].toUpperCase()}</div>
                {!sidebarCollapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
                    <div style={{ fontSize: 10.5, color: theme.textFaint }}>View settings</div>
                  </div>
                )}
                {!sidebarCollapsed && <Settings size={14} color={theme.textFaint} />}
              </div>
            </Glass>

            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="press"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "9px 0", borderRadius: 11, border: theme.inputBorder, background: theme.inputBg,
                color: theme.textDim, cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}
            >
              {sidebarCollapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> Collapse</>}
            </button>
          </div>
        </LiquidGlassShell>
      )}

      {isDesktop && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 40 }}>
          <InstallButton theme={theme} isDesktop={true} />
        </div>
      )}

      <div style={{ flex: 1, maxWidth: contentMaxWidth, margin: isDesktop ? "0 auto" : 0, width: "100%" }}>
        <div style={{ padding: isDesktop ? "28px 32px 60px" : "20px 16px 100px" }}>
          {!isDesktop && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px -4px rgba(61,220,151,0.5)" }}><Flame size={14} color="#0A0E12" strokeWidth={2.5} /></div>
                <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 16, color: theme.text }}>Scoreline</span>
              </div>
              <InstallButton theme={theme} isDesktop={false} />
            </div>
          )}

          {showSettings ? (
            <div style={{ maxWidth: isDesktop ? 640 : "none" }}>
              <SettingsPanel onBack={() => setShowSettings(false)} theme={theme} settings={settings} setSettings={setSettings} profile={profile} setProfile={setProfile} />
            </div>
          ) : activeMatch ? (
            <div style={{ maxWidth: isWide ? 1000 : "none" }}>
              <MatchDetail
                m={activeMatch}
                onBack={() => setActiveMatchId(null)}
                onUpdate={updateMatch}
                theme={theme}
                isDesktop={isDesktop}
                isOwner={isOwnerOf(activeMatch)}
                onToast={showToast}
              />
            </div>
          ) : tab === "home" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: theme.text }}>Live right now</h1>
              <p style={{ fontSize: 13.5, color: theme.textFaint, margin: "0 0 20px" }}>{liveMatches.length} matches in progress across 4 sports</p>
              <div style={feedGridStyle}>
                {liveMatches.map(m => <MatchCard key={m.id} m={m} onOpen={openMatch} theme={theme} isOwner={isOwnerOf(m)} />)}
              </div>
              {upcomingMatches.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "24px 0 12px" }}><Calendar size={13} color={theme.textFaint} /><span style={{ fontSize: 12, fontWeight: 700, color: theme.textFaint, letterSpacing: "0.02em" }}>UPCOMING</span></div>
                  <div style={feedGridStyle}>
                    {upcomingMatches.map(m => <UpcomingCard key={m.id} m={m} onOpen={openMatch} theme={theme} isOwner={isOwnerOf(m)} />)}
                  </div>
                </>
              )}
            </div>
          ) : tab === "explore" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 700, margin: "0 0 16px", color: theme.text }}>Explore</h1>
              <div style={{ display: "flex", gap: 8, background: theme.inputBg, border: theme.inputBorder, borderRadius: 14, padding: "12px 14px", marginBottom: 20, alignItems: "center" }}>
                <Search size={16} color={theme.textFaint} />
                <span style={{ color: theme.textFaint, fontSize: 14 }}>Search public matches, teams, players…</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {["soccer", "cricket", "badminton", "volleyball"].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, background: theme.inputBg, border: theme.inputBorder, fontSize: 13, color: theme.text }}>{SPORT_ICON[s]} <span style={{ textTransform: "capitalize" }}>{s}</span></div>
                ))}
              </div>
              <div style={feedGridStyle}>
                {matches.filter(m => m.visibility === "public").map(m => <MatchCard key={m.id} m={m} onOpen={openMatch} theme={theme} isOwner={isOwnerOf(m)} />)}
              </div>
            </div>
          ) : tab === "leaderboard" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 700, margin: "0 0 16px", color: theme.text }}>Leaderboard</h1>
              {["Riverside FC", "Delta Strikers", "Sunset Spikers", "N. Rao"].map((name, i) => (
                <Glass key={name} theme={theme} style={{ padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: 16, color: i === 0 ? "#FFB800" : theme.textFaint, width: 20 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: theme.text }}>{name}</span>
                  <span style={{ fontSize: 12.5, color: theme.textFaint }}>{12 - i * 2} wins</span>
                </Glass>
              ))}
            </div>
          ) : (
            <Profile
              onOpenSettings={() => setShowSettings(true)}
              onOpenMatches={() => setShowMatchesPanel(true)}
              theme={theme}
              profile={profile}
              ownedCount={ownedMatches.length}
              sportsUsed={sportsUsed}
              publicCount={publicOwnedCount}
            />
          )}
        </div>
      </div>

      {showMatchesPanel && (
        <MatchesPanel matches={ownedMatches} onOpen={(m) => { setShowMatchesPanel(false); openMatch(m); }} onClose={() => setShowMatchesPanel(false)} theme={theme} />
      )}

      {!isDesktop && (
        <LiquidGlassShell theme={theme} style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, borderTop: `1px solid ${theme.hairline}`, borderRadius: "22px 22px 0 0", display: "flex", justifyContent: "space-around", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))" }}>
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id && !activeMatch && !showSettings;
            const isCreate = n.id === "create";
            return (
              <button key={n.id} className="navicon press" onClick={() => { isCreate ? setShowCreate(true) : (setTab(n.id), setActiveMatchId(null), setShowSettings(false)); }} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 10px", color: active ? "#3DDC97" : theme.textDim }}>
                {isCreate ? (
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg, #3DDC97, #4EC5FF)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: -2, boxShadow: "0 4px 14px -4px rgba(61,220,151,0.5)" }}><PlusCircle size={18} color="#0A0E12" strokeWidth={2.5} /></div>
                ) : (<Icon size={21} strokeWidth={active ? 2.4 : 2} />)}
                {!isCreate && <span style={{ fontSize: 9.5, fontWeight: 600 }}>{n.label}</span>}
              </button>
            );
          })}
        </LiquidGlassShell>
      )}

      {showCreate && <CreateMatch onClose={() => setShowCreate(false)} onCreate={handleCreate} theme={theme} />}
      {toast && <Toast key={toast.key} message={toast.message} accent={toast.accent} theme={theme} onDone={() => setToast(null)} />}
    </div>
  );
}
