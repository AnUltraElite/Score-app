// ============================================================
// CRICKET SCORING ENGINE — pure logic, no UI
// ============================================================
// A "pending ball" flows through: choose outcome -> (optional bye/legbye + runs) -> confirm "Next ball"
// Only on confirm does it get committed into balls/overHistory/runs/wickets/strike rotation.

// Ball outcome shape once committed to history:
//   number (0-6)          -> normal runs off the bat, legal delivery
//   { type: "wide", runs } -> wide, illegal delivery, runs = 1 + any extra run byes on the wide (rare, default 1)
//   { type: "noball", runs } -> no ball, illegal delivery, runs = 1 + runs scored off the bat
//   { type: "bye", runs }   -> bye, legal delivery, runs = runs taken (min 1)
//   { type: "legbye", runs } -> leg bye, legal delivery, runs = runs taken (min 1)
//   "W" or { type: "wicket", runs } -> wicket. runs (if any, e.g. run out on a run) default 0

export function displayBall(ball) {
  if (ball === "W") return "W";
  if (typeof ball === "number") return String(ball);
  if (ball.type === "wicket") return "W";
  if (ball.type === "wide") return `Wd${ball.runs > 1 ? "+" + (ball.runs - 1) : ""}`;
  if (ball.type === "noball") return `Nb${ball.runs > 1 ? "+" + (ball.runs - 1) : ""}`;
  if (ball.type === "bye") return `B${ball.runs}`;
  if (ball.type === "legbye") return `LB${ball.runs}`;
  return "?";
}

// Colored outcomes (wicket/boundary/extra/bye) use fixed accent colors that
// read fine on both light and dark backgrounds. The plain dot-ball/single-run
// case has no accent, so it must follow the active theme's text/background —
// hardcoding white here was invisible on the light theme's pale chip background.
export function ballChipStyle(ball, theme) {
  const isWicket = ball === "W" || ball?.type === "wicket";
  const isBoundary = ball === 4 || ball === 6;
  const isExtra = ball?.type === "wide" || ball?.type === "noball";
  const isByeType = ball?.type === "bye" || ball?.type === "legbye";
  if (isWicket) return { bg: "rgba(255,70,85,0.14)", fg: "#FF6B78", bd: "rgba(255,70,85,0.4)" };
  if (isBoundary) return { bg: "rgba(255,184,0,0.14)", fg: "#FFC933", bd: "rgba(255,184,0,0.4)" };
  if (isExtra) return { bg: "rgba(78,197,255,0.12)", fg: "#4EC5FF", bd: "rgba(78,197,255,0.35)" };
  if (isByeType) return { bg: "rgba(185,139,255,0.12)", fg: "#B98BFF", bd: "rgba(185,139,255,0.35)" };
  if (theme && !theme.dark) {
    return { bg: "rgba(18,24,31,0.06)", fg: "#12181F", bd: "rgba(18,24,31,0.14)" };
  }
  return { bg: "rgba(255,255,255,0.06)", fg: "#fff", bd: "rgba(255,255,255,0.12)" };
}

// Is this delivery "legal" (counts toward the 6-ball over)?
export function isLegalDelivery(ball) {
  if (ball?.type === "wide" || ball?.type === "noball") return false;
  return true; // runs, bye, legbye, wicket are all legal deliveries
}

// Total runs a ball outcome adds to the team score
export function runsForBall(ball) {
  if (ball === "W") return 0;
  if (typeof ball === "number") return ball;
  if (ball.type === "wicket") return ball.runs || 0;
  return ball.runs || 0;
}

// Runs credited to the striker's individual score (byes/leg-byes/wides don't count; no-ball runs off the bat do)
export function batterRuns(ball) {
  if (typeof ball === "number") return ball;
  if (ball?.type === "noball") return Math.max(0, (ball.runs || 1) - 1);
  return 0;
}

// Does this ball rotate the strike (odd runs actually run between the wickets)?
export function rotatesStrike(ball) {
  if (typeof ball === "number") return ball % 2 === 1;
  if (ball?.type === "bye" || ball?.type === "legbye") return (ball.runs || 0) % 2 === 1;
  if (ball?.type === "noball") return Math.max(0, (ball.runs || 1) - 1) % 2 === 1;
  return false; // wides don't run between wickets in our simplified model; wickets don't rotate
}

// Apply one committed ball to a cricket innings draft (mutates draft.a in place).
// draft shape expected: { a: { runs, wickets, ballsBowled }, balls: [...currentOverBalls], overHistory: [...] , striker, nonStriker, bowler }
// Returns { overJustCompleted: bool } so callers (UI) can react, e.g. show a toast.
// Refuses to score if the innings is flagged complete (e.g. overs finished,
// all out) and hasn't been resolved yet — enforces "no ball can be
// delivered" until the scorer starts the next innings or raises the limit.
export function applyBall(draft, ball) {
  if (draft.inningsComplete) return draft;
  if (!draft.striker || !draft.nonStriker) return draft; // both batters must be set before any ball is scored

  if (!draft.balls) draft.balls = [];
  if (!draft.overHistory) draft.overHistory = [];

  const legal = isLegalDelivery(ball);
  const runs = runsForBall(ball);
  const credited = batterRuns(ball);

  draft.a.runs = (draft.a.runs || 0) + runs;
  if (ball === "W" || ball?.type === "wicket") {
    draft.a.wickets = (draft.a.wickets || 0) + 1;
  }
  if (legal) {
    draft.a.ballsBowled = (draft.a.ballsBowled || 0) + 1;
  }

  // credit individual batter runs
  if (credited > 0 && draft.striker) {
    if (!draft.batterStats) draft.batterStats = {};
    if (!draft.batterStats[draft.striker]) draft.batterStats[draft.striker] = { runs: 0, balls: 0 };
    draft.batterStats[draft.striker].runs += credited;
  }
  if (legal && draft.striker) {
    if (!draft.batterStats) draft.batterStats = {};
    if (!draft.batterStats[draft.striker]) draft.batterStats[draft.striker] = { runs: 0, balls: 0 };
    draft.batterStats[draft.striker].balls += 1;
  }

  // credit bowler figures: balls bowled (legal only), runs conceded (all runs off the bowler,
  // i.e. everything except byes/leg-byes which aren't the bowler's fault), wickets taken
  if (draft.bowler) {
    if (!draft.bowlerStats) draft.bowlerStats = {};
    if (!draft.bowlerStats[draft.bowler]) draft.bowlerStats[draft.bowler] = { balls: 0, runs: 0, wickets: 0 };
    const concedesRuns = ball?.type === "bye" || ball?.type === "legbye" ? 0 : runs;
    draft.bowlerStats[draft.bowler].runs += concedesRuns;
    if (legal) draft.bowlerStats[draft.bowler].balls += 1;
    if (ball === "W" || ball?.type === "wicket") draft.bowlerStats[draft.bowler].wickets += 1;
  }

  draft.balls = [...draft.balls, ball];

  // rotate strike on odd runs run
  if (rotatesStrike(ball)) {
    const tmp = draft.striker;
    draft.striker = draft.nonStriker;
    draft.nonStriker = tmp;
  }

  // over completes after 6 LEGAL deliveries
  const legalCountThisOver = draft.balls.filter(isLegalDelivery).length;
  let overJustCompleted = false;
  if (legalCountThisOver === 6) {
    draft.overHistory = [...draft.overHistory, draft.balls];
    draft.balls = [];
    overJustCompleted = true;
    // rotate strike at end of over
    const tmp = draft.striker;
    draft.striker = draft.nonStriker;
    draft.nonStriker = tmp;
  }

  const overs = draft.overHistory.length;
  const ballsInCurrentOver = draft.balls.filter(isLegalDelivery).length;
  draft.a.overs = `${overs}.${ballsInCurrentOver}`;
  draft.a.score = `${draft.a.runs}/${draft.a.wickets || 0}`;

  // handle wicket: clear striker, prompt for new batter
  if (ball === "W" || ball?.type === "wicket") {
    if (!draft.dismissed) draft.dismissed = [];
    if (draft.striker) draft.dismissed = [...draft.dismissed, draft.striker];
    draft.striker = null;
  }

  draft._lastOverCompleted = overJustCompleted; // surfaced for UI toast, not real domain state
  return draft;
}

// Undo the last committed ball. Handles pulling back from a completed over.
export function undoLastBall(draft) {
  let balls = draft.balls || [];
  let pulledFromHistory = false;

  if (balls.length === 0 && (draft.overHistory || []).length > 0) {
    balls = draft.overHistory[draft.overHistory.length - 1];
    draft.overHistory = draft.overHistory.slice(0, -1);
    pulledFromHistory = true;
  }
  if (balls.length === 0) return draft;

  const last = balls[balls.length - 1];
  draft.balls = balls.slice(0, -1);

  const legal = isLegalDelivery(last);
  const runs = runsForBall(last);
  const credited = batterRuns(last);

  draft.a.runs = Math.max(0, (draft.a.runs || 0) - runs);
  if (last === "W" || last?.type === "wicket") {
    draft.a.wickets = Math.max(0, (draft.a.wickets || 0) - 1);
    // restore dismissed batter as striker (best-effort)
    if (draft.dismissed && draft.dismissed.length > 0) {
      const restored = draft.dismissed[draft.dismissed.length - 1];
      draft.dismissed = draft.dismissed.slice(0, -1);
      draft.striker = restored;
    }
  }
  if (legal) draft.a.ballsBowled = Math.max(0, (draft.a.ballsBowled || 0) - 1);

  if (credited > 0 && draft.striker && draft.batterStats?.[draft.striker]) {
    draft.batterStats[draft.striker].runs = Math.max(0, draft.batterStats[draft.striker].runs - credited);
  }
  if (legal && draft.striker && draft.batterStats?.[draft.striker]) {
    draft.batterStats[draft.striker].balls = Math.max(0, draft.batterStats[draft.striker].balls - 1);
  }

  if (draft.bowler && draft.bowlerStats?.[draft.bowler]) {
    const concedesRuns = last?.type === "bye" || last?.type === "legbye" ? 0 : runs;
    draft.bowlerStats[draft.bowler].runs = Math.max(0, draft.bowlerStats[draft.bowler].runs - concedesRuns);
    if (legal) draft.bowlerStats[draft.bowler].balls = Math.max(0, draft.bowlerStats[draft.bowler].balls - 1);
    if (last === "W" || last?.type === "wicket") draft.bowlerStats[draft.bowler].wickets = Math.max(0, draft.bowlerStats[draft.bowler].wickets - 1);
  }

  // undo strike rotation if that ball rotated it (best-effort re-swap)
  if (rotatesStrike(last) || pulledFromHistory) {
    const tmp = draft.striker;
    draft.striker = draft.nonStriker;
    draft.nonStriker = tmp;
  }

  const overs = draft.overHistory.length;
  const ballsInCurrentOver = draft.balls.filter(isLegalDelivery).length;
  draft.a.overs = `${overs}.${ballsInCurrentOver}`;
  draft.a.score = `${draft.a.runs}/${draft.a.wickets || 0}`;

  return draft;
}

export function overRuns(over) {
  return over.reduce((sum, b) => sum + runsForBall(b), 0);
}

// Formats a legal-ball count as cricket overs notation, e.g. 14 balls -> "2.2"
export function formatOvers(legalBalls) {
  const overs = Math.floor((legalBalls || 0) / 6);
  const balls = (legalBalls || 0) % 6;
  return `${overs}.${balls}`;
}

// ============================================================
// INNINGS COMPLETION
// ============================================================
// Cricket doesn't allow a lone batter ("last man"/"last woman" stands) —
// an innings with a squad of N batters ends once N-1 are out, because
// there's no partner left to run with. With a squad of N, the maximum
// wickets that can fall is N-1.
export function maxWicketsFor(squadSize) {
  if (!squadSize || squadSize < 2) return 0;
  return squadSize - 1;
}

// Works out whether the batting side's innings should stop right now, and
// why. Doesn't mutate anything — callers decide what to do with the result.
// target: runs the batting side needs to win, only relevant in the 2nd innings.
export function checkInningsComplete(draft, squadSize, target) {
  const ballsBowled = draft.a.ballsBowled || 0;
  const wickets = draft.a.wickets || 0;
  const runs = draft.a.runs || 0;
  const oversLimitBalls = (draft.overLimit || 0) * 6;

  if (typeof target === "number" && runs >= target) {
    return { complete: true, reason: "target" };
  }
  if (wickets >= maxWicketsFor(squadSize)) {
    return { complete: true, reason: "wickets" };
  }
  if (oversLimitBalls > 0 && ballsBowled >= oversLimitBalls) {
    return { complete: true, reason: "overs" };
  }
  return { complete: false, reason: null };
}

// Chase math for the 2nd innings: current run rate, required run rate,
// and a plain-English "need X runs off Y balls" line.
export function chaseStats({ target, runsScored, ballsBowled, totalBalls }) {
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
  const runsNeeded = Math.max(0, target - runsScored);
  const oversBowled = (ballsBowled || 0) / 6;
  const currentRunRate = oversBowled > 0 ? runsScored / oversBowled : 0;
  const requiredRunRate = ballsRemaining > 0 ? (runsNeeded / ballsRemaining) * 6 : 0;
  return {
    runsNeeded,
    ballsRemaining,
    currentRunRate: Math.round(currentRunRate * 100) / 100,
    requiredRunRate: Math.round(requiredRunRate * 100) / 100,
  };
}

// Builds the frozen summary of a just-finished innings, for display once
// the 2nd innings starts ("Delta Strikers: 156/7 (20 overs)").
export function summarizeInnings(team, teamName) {
  return {
    teamName,
    runs: team.runs || 0,
    wickets: team.wickets || 0,
    overs: team.overs || "0.0",
  };
}
