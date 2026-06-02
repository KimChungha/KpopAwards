const ADMIN_USER = "admin";
const ADMIN_PASS = "admin";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function isAuthenticated(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  try {
    const decoded = atob(auth.replace("Bearer ", ""));
    const [user, pass] = decoded.split(":");
    return user === ADMIN_USER && pass === ADMIN_PASS;
  } catch {
    return false;
  }
}

// ── YEARS ────────────────────────────────────────────────────────

async function getYears(db) {
  const { results } = await db.prepare("SELECT * FROM years ORDER BY year DESC").all();
  return results;
}

async function handleYears(request, db) {
  if (request.method === "GET") {
    const years = await getYears(db);
    return json(years);
  }

  if (request.method === "POST") {
    if (!isAuthenticated(request)) return json({ error: "Unauthorized" }, 401);
    const body = await request.json();
    const year = parseInt(body.year);
    if (!year || year < 2000 || year > 2099) return json({ error: "Invalid year" }, 400);

    const existing = await db.prepare("SELECT year FROM years WHERE year = ?").bind(year).first();
    if (existing) return json({ error: "Year already exists" }, 409);

    await db.prepare("INSERT INTO years (year, status, created_at) VALUES (?, 'open', ?)")
      .bind(year, new Date().toISOString())
      .run();

    return json({ year, status: "open", created_at: new Date().toISOString() }, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}

// ── NOMINATIONS ──────────────────────────────────────────────────

async function handleNominations(request, db, url) {
  const year = parseInt(url.searchParams.get("year"));

  if (request.method === "GET") {
    if (!year) return json({ error: "year required" }, 400);
    const { results } = await db.prepare("SELECT * FROM nominations WHERE year = ? ORDER BY created_at ASC")
      .bind(year).all();
    // Parse data JSON for each nomination
    return json(results.map(n => ({ ...n, data: JSON.parse(n.data) })));
  }

  if (request.method === "POST") {
    if (!isAuthenticated(request)) return json({ error: "Unauthorized" }, 401);
    const body = await request.json();
    const { category, data } = body;
    const yearNum = parseInt(body.year);

    if (!yearNum || !category || !data) return json({ error: "year, category and data required" }, 400);

    const validCategories = ["song", "album", "concert", "rookie"];
    if (!validCategories.includes(category)) return json({ error: "Invalid category" }, 400);

    const yearObj = await db.prepare("SELECT * FROM years WHERE year = ?").bind(yearNum).first();
    if (!yearObj) return json({ error: "Year not found" }, 404);
    if (yearObj.status !== "open") return json({ error: "This year is locked" }, 403);

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const createdAt = new Date().toISOString();
    await db.prepare("INSERT INTO nominations (id, year, category, data, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, yearNum, category, JSON.stringify(data), createdAt)
      .run();

    return json({ id, year: yearNum, category, data, created_at: createdAt }, 201);
  }

  if (request.method === "DELETE") {
    if (!isAuthenticated(request)) return json({ error: "Unauthorized" }, 401);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id required" }, 400);
    await db.prepare("DELETE FROM nominations WHERE id = ?").bind(id).run();
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
}

// ── WINNERS ──────────────────────────────────────────────────────

async function handleWinners(request, db, url) {
  const year = parseInt(url.searchParams.get("year"));

  if (request.method === "GET") {
    if (!year) return json({ error: "year required" }, 400);
    const { results } = await db.prepare("SELECT category, nomination_id FROM winners WHERE year = ?")
      .bind(year).all();
    // Return as { song: id, album: id, ... }
    const winners = {};
    results.forEach(w => { winners[w.category] = w.nomination_id; });
    return json(winners);
  }

  if (request.method === "POST") {
    if (!isAuthenticated(request)) return json({ error: "Unauthorized" }, 401);
    const body = await request.json();
    const yearNum = parseInt(body.year);
    const winners = body.winners;

    if (!yearNum || !winners) return json({ error: "year and winners required" }, 400);

    const yearObj = await db.prepare("SELECT * FROM years WHERE year = ?").bind(yearNum).first();
    if (!yearObj) return json({ error: "Year not found" }, 404);

    // Save each winner and lock the year in one batch
    const stmts = [];
    for (const [category, nominationId] of Object.entries(winners)) {
      stmts.push(
        db.prepare("INSERT OR REPLACE INTO winners (year, category, nomination_id) VALUES (?, ?, ?)")
          .bind(yearNum, category, nominationId)
      );
    }
    stmts.push(
      db.prepare("UPDATE years SET status = 'complete' WHERE year = ?").bind(yearNum)
    );
    await db.batch(stmts);

    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
}

// ── AUTH ─────────────────────────────────────────────────────────

async function handleAuth(request) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const { username, password } = await request.json();
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = btoa(`${username}:${password}`);
    return json({ success: true, token });
  }
  return json({ success: false, error: "Invalid credentials" }, 401);
}

// ── ROUTER ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // API routes
    if (url.pathname === "/api/auth") return handleAuth(request);
    if (url.pathname === "/api/years") return handleYears(request, env.DB);
    if (url.pathname === "/api/nominations") return handleNominations(request, env.DB, url);
    if (url.pathname === "/api/winners") return handleWinners(request, env.DB, url);

    // 404 for unknown API routes
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

    // All other routes serve the static frontend (handled by Cloudflare Assets)
    return env.ASSETS.fetch(request);
  },
};
