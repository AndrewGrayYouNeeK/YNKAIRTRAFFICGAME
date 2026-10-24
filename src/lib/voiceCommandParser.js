const DIGIT_WORDS = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  too: "2",
  to: "2",
  tree: "3",
  three: "3",
  four: "4",
  for: "4",
  fife: "5",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  ate: "8",
  niner: "9",
  nine: "9",
};

const LETTER_WORDS = {
  alpha: "A", bravo: "B", charlie: "C", delta: "D", echo: "E", foxtrot: "F",
  golf: "G", hotel: "H", india: "I", juliet: "J", kilo: "K", lima: "L",
  mike: "M", november: "N", oscar: "O", papa: "P", quebec: "Q", romeo: "R",
  sierra: "S", tango: "T", uniform: "U", victor: "V", whiskey: "W", xray: "X",
  yankee: "Y", zulu: "Z",
};

const AIRLINE_PREFIX = {
  united: "UAL",
  delta: "DAL",
  american: "AAL",
  southwest: "SWA",
  british: "BAW",
  lufthansa: "DLH",
  emirates: "UAE",
};

const tokenToDigit = (token) => {
  if (!token) return null;
  if (/^\d$/.test(token)) return token;
  return DIGIT_WORDS[token] ?? null;
};

const cleanTranscript = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TOKEN_ALIASES = {
  hdg: "heading",
  head: "heading",
  hed: "heading",
  heding: "heading",
  hedng: "heading",
  alt: "altitude",
  spd: "speed",
  kts: "knots",
  kt: "knots",
  rwy: "runway",
  rw: "runway",
  landing: "land",
  clear: "cleared",
  clr: "cleared",
  decent: "descend",
  decend: "descend",
  clmb: "climb",
  fl: "flight",
  lvl: "level",
  slower: "slow",
};

function extractDigitSequence(tokens, startIndex) {
  const digits = [];
  let i = startIndex;
  for (; i < tokens.length; i += 1) {
    const token = tokens[i];
    const nextToken = tokens[i + 1] || "";
    const nextIsNumber = /^\d+$/.test(nextToken) || tokenToDigit(nextToken) !== null;
    const filler = token === "to" || token === "for" || token === "at";
    if (filler && nextIsNumber && (digits.length === 0 || /^\d{2,}$/.test(nextToken))) {
      continue;
    }
    if (/^\d+$/.test(token)) {
      digits.push(token);
      continue;
    }
    const digit = tokenToDigit(token);
    if (digit === null) break;
    digits.push(digit);
  }
  return { value: digits.join(""), nextIndex: i };
}

function aliasTokens(tokens) {
  return tokens.map((token) => TOKEN_ALIASES[token] || token);
}

function normalizeCallsign(candidate, aircraft = []) {
  if (!candidate) return null;
  const normalized = candidate.toUpperCase();
  if (!aircraft.length) return normalized;
  let best = normalized;
  let bestScore = 0;
  const candidateDigits = normalized.replace(/\D/g, "");
  const candidateLetters = normalized.replace(/\d/g, "");

  aircraft.forEach((plane) => {
    const cs = String(plane.callsign || "").toUpperCase();
    if (!cs) return;
    let score = 0;
    if (cs === normalized) score += 4;
    if (candidateDigits && cs.endsWith(candidateDigits)) score += 2;
    if (candidateLetters && cs.startsWith(candidateLetters)) score += 1;
    if (candidateDigits && cs.includes(candidateDigits)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = cs;
    }
  });
  return best;
}

function parseCallsign(tokens, aircraft) {
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i].toUpperCase();
    if (/^[A-Z]{1,3}\d{1,4}$/.test(token)) return normalizeCallsign(token, aircraft);
    const merged = `${tokens[i]}${tokens[i + 1] || ""}`.toUpperCase();
    if (/^[A-Z]{1,3}\d{1,4}$/.test(merged)) return normalizeCallsign(merged, aircraft);
  }

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (AIRLINE_PREFIX[token]) {
      const digits = extractDigitSequence(tokens, i + 1).value;
      if (digits) return normalizeCallsign(`${AIRLINE_PREFIX[token]}${digits}`, aircraft);
    }
  }

  for (let i = 0; i < tokens.length; i += 1) {
    if (LETTER_WORDS[tokens[i]]) {
      const prefix = LETTER_WORDS[tokens[i]];
      const digits = extractDigitSequence(tokens, i + 1).value;
      if (digits) return normalizeCallsign(`${prefix}${digits}`, aircraft);
    }
  }

  for (let i = 0; i < tokens.length; i += 1) {
    const first = tokens[i];
    const second = tokens[i + 1];
    const third = tokens[i + 2];
    if (!first || !second || !third) continue;
    const letters = [first, second, third]
      .map((t) => (t.length === 1 ? t.toUpperCase() : LETTER_WORDS[t]))
      .join("");
    if (/^[A-Z]{3}$/.test(letters)) {
      const digits = extractDigitSequence(tokens, i + 3).value;
      if (digits) return normalizeCallsign(`${letters}${digits}`, aircraft);
    }
  }

  return null;
}

function parseHeading(tokens) {
  const headingIndex = tokens.indexOf("heading");
  if (headingIndex === -1) return null;
  const digits = extractDigitSequence(tokens, headingIndex + 1).value;
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  if (Number.isNaN(value)) return null;
  return Math.max(0, Math.min(360, value));
}

function parseAltitude(tokens) {
  const flIndex = tokens.findIndex((t) => t === "flight");
  if (flIndex >= 0 && tokens[flIndex + 1] === "level") {
    const digits = extractDigitSequence(tokens, flIndex + 2).value;
    if (digits) return Number.parseInt(digits, 10) * 100;
  }

  const thousandIndex = tokens.indexOf("thousand");
  if (thousandIndex > 0) {
    const digits = extractDigitSequence(tokens, thousandIndex - 1).value;
    if (digits) return Number.parseInt(digits, 10) * 1000;
  }

  const keywordAt = ["descend", "climb", "maintain", "altitude", "down", "up"]
    .map((keyword) => tokens.indexOf(keyword))
    .filter((index) => index >= 0);
  const start = keywordAt.length ? Math.min(...keywordAt) + 1 : 0;

  for (let i = start; i < tokens.length; i += 1) {
    if (/^\d{3,5}$/.test(tokens[i])) {
      const value = Number.parseInt(tokens[i], 10);
      if (value >= 100 && value <= 45000) return value;
    }
  }

  for (let i = start; i < tokens.length; i += 1) {
    const digits = extractDigitSequence(tokens, i).value;
    if (digits.length >= 3) return Number.parseInt(digits, 10);
  }
  return null;
}

function parseSpeed(tokens) {
  const speedIndex = tokens.findIndex((token) => token === "speed" || token === "slow" || token === "knots");
  if (speedIndex === -1) return null;
  const toIndex = tokens.indexOf("to", speedIndex);
  const forward = extractDigitSequence(tokens, toIndex >= 0 ? toIndex + 1 : speedIndex + 1).value;
  const digits = forward || extractDigitSequence(tokens, Math.max(0, speedIndex - 1)).value;
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) return null;
  return Math.max(80, Math.min(450, value));
}

function parseHeadingLoose(tokens) {
  if (tokens.includes("heading")) return parseHeading(tokens);
  if (!tokens.includes("turn") && !tokens.includes("left") && !tokens.includes("right")) return null;
  for (let i = 0; i < tokens.length; i += 1) {
    const digits = extractDigitSequence(tokens, i).value;
    if (!digits || digits.length > 3) continue;
    const value = Number.parseInt(digits, 10);
    if (value <= 360) return value;
  }
  return null;
}

function parseRunwayLoose(tokens) {
  const named = parseRunway(tokens);
  if (named) return named;
  for (const token of tokens) {
    const compact = token.toUpperCase().match(/^(\d{1,2})([LRC])$/);
    if (compact) return `${compact[1].padStart(2, "0")}${compact[2]}`;
  }
  return null;
}

function parseRunway(tokens) {
  const runwayIndex = tokens.indexOf("runway");
  if (runwayIndex === -1) return null;
  const raw = tokens[runwayIndex + 1] || "";
  const compact = raw.toUpperCase().match(/^(\d{1,2})([LRC])$/);
  if (compact) return `${compact[1].padStart(2, "0")}${compact[2]}`;
  const { value: digits, nextIndex } = extractDigitSequence(tokens, runwayIndex + 1);
  if (!digits) return null;
  const side = tokens[nextIndex];
  const suffix = side === "left" ? "L" : side === "right" ? "R" : side === "center" || side === "centre" ? "C" : "";
  return `${digits.padStart(2, "0")}${suffix}`;
}

function parseFrequency(tokens) {
  const pointIndex = tokens.findIndex((t) => t === "point" || t === "decimal");
  if (pointIndex === -1) return null;
  const whole = extractDigitSequence(tokens, Math.max(0, pointIndex - 3)).value;
  const frac = extractDigitSequence(tokens, pointIndex + 1).value;
  if (!whole || !frac) return null;
  return `${Number.parseInt(whole, 10)}.${frac}`;
}

function parseSquawk(tokens) {
  const sqIndex = tokens.indexOf("squawk");
  if (sqIndex === -1) return null;
  const digits = extractDigitSequence(tokens, sqIndex + 1).value;
  return digits?.slice(0, 4) || null;
}

export function describeCommand(command) {
  if (!command) return null;
  switch (command.type) {
    case "set_heading":
      return `heading ${command.value}`;
    case "set_altitude":
      return `altitude ${command.value} feet`;
    case "set_speed":
      return `speed ${command.value} knots`;
    case "cleared_to_land":
      return `cleared to land${command.runway ? ` runway ${command.runway}` : ""}`;
    case "go_around":
      return "go around";
    case "frequency_change":
      return `contact approach ${command.freq}`;
    case "squawk":
      return `squawk ${command.code}`;
    default: {
      const unknown = command.type;
      void unknown;
      return command.type;
    }
  }
}

export function suggestPhrase(transcript, context = {}) {
  const tokens = aliasTokens(cleanTranscript(transcript).split(" ").filter(Boolean));
  const callsign = context.callsign || "CALLSIGN";
  const runway = context.runway || "24L";
  if (tokens.includes("land") || tokens.includes("cleared")) {
    return `${callsign} cleared to land runway ${runway}`;
  }
  if (tokens.includes("heading") || tokens.includes("turn") || tokens.includes("left") || tokens.includes("right")) {
    return `${callsign} heading 250`;
  }
  if (["descend", "climb", "maintain", "altitude", "down", "up"].some((word) => tokens.includes(word))) {
    return `${callsign} descend to 5000`;
  }
  if (tokens.includes("speed") || tokens.includes("slow") || tokens.includes("knots")) {
    return `${callsign} speed 160`;
  }
  return context.example || `${callsign} heading 250`;
}

function buildReadback(command) {
  if (!command?.callsign) return "Say again.";
  switch (command.type) {
    case "set_heading":
      return `${command.callsign}, turn heading ${command.value}, roger.`;
    case "set_altitude":
      return `${command.callsign}, maintain ${command.value} feet, roger.`;
    case "set_speed":
      return `${command.callsign}, reduce speed to ${command.value} knots, roger.`;
    case "cleared_to_land":
      return `${command.callsign}, cleared to land${command.runway ? ` runway ${command.runway}` : ""}, roger.`;
    case "go_around":
      return `${command.callsign}, go around, roger.`;
    case "frequency_change":
      return `${command.callsign}, contact approach ${command.freq}, roger.`;
    case "squawk":
      return `${command.callsign}, squawk ${command.code}, roger.`;
    default:
      return "Say again.";
  }
}

export default function parseATCCommand(transcript, aircraft = [], selectedPlane = null, context = {}) {
  const cleaned = cleanTranscript(transcript);
  const tokens = aliasTokens(cleaned.split(" ").filter(Boolean));
  const selectedCallsign =
    typeof selectedPlane === "string" ? selectedPlane : selectedPlane?.callsign || null;
  const hint = {
    callsign: selectedCallsign || context.callsign,
    runway: context.runway,
    example: context.example,
  };

  if (!tokens.length) {
    const suggestion = suggestPhrase("", hint);
    return {
      command: null,
      confidence: 0,
      heard: transcript || "",
      understood: null,
      suggestion,
      readback: `Say again. Try: ${suggestion}`,
    };
  }

  const detectedCallsign = parseCallsign(tokens, aircraft);
  const callsign = detectedCallsign || selectedCallsign;
  hint.callsign = callsign || hint.callsign;

  let command = null;
  const wantsSpeed = tokens.includes("speed") || tokens.includes("slow") || tokens.includes("knots");
  const headingValue = parseHeadingLoose(tokens);

  if (tokens.includes("land")) {
    const runway = parseRunwayLoose(tokens);
    if (callsign) command = { callsign, type: "cleared_to_land", ...(runway ? { runway } : {}) };
  } else if (headingValue !== null && callsign && (tokens.includes("heading") || tokens.includes("turn") || tokens.includes("left") || tokens.includes("right"))) {
    command = { callsign, type: "set_heading", value: headingValue };
  } else if (wantsSpeed) {
    const value = parseSpeed(tokens);
    if (callsign && value !== null) command = { callsign, type: "set_speed", value };
  } else if (["descend", "climb", "maintain", "altitude", "down", "up"].some((word) => tokens.includes(word))) {
    const value = parseAltitude(tokens);
    if (callsign && value !== null) command = { callsign, type: "set_altitude", value };
  } else if (tokens.includes("go") && tokens.includes("around")) {
    if (callsign) command = { callsign, type: "go_around" };
  } else if (tokens.includes("contact") && tokens.includes("approach")) {
    const freq = parseFrequency(tokens);
    if (callsign && freq) command = { callsign, type: "frequency_change", freq };
  } else if (tokens.includes("squawk")) {
    const code = parseSquawk(tokens);
    if (code && selectedCallsign) command = { callsign: selectedCallsign, type: "squawk", code };
  }

  const suggestion = command ? null : suggestPhrase(transcript, hint);
  const confidence = command ? (detectedCallsign || command.type === "squawk" ? 0.9 : 0.65) : 0.2;
  return {
    command,
    confidence,
    heard: transcript || "",
    understood: describeCommand(command),
    suggestion,
    readback: command ? buildReadback(command) : `Say again. Try: ${suggestion}`,
  };
}
