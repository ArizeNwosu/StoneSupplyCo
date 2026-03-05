#!/usr/bin/env python3
"""
CONTRACT INTEL - Local Backend Server
Proxies SAM.gov API calls (bypasses browser CORS) and serves the frontend.

Usage:
    python3 server.py

Then open: http://localhost:8765
"""

import json
import os
import re
import time
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timedelta

PORT = 8765
SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search"


def load_dotenv():
    """Load .env file into os.environ. Existing env vars take priority."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, val = line.partition('=')
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


load_dotenv()

# ── SAM.gov key (get free key at sam.gov/profile/details → Public API Key)
SAM_API_KEY      = os.environ.get("SAM_API_KEY", "DEMO_KEY")

# ── LLM keys (loaded from .env automatically)
GEMINI_API_KEY    = os.environ.get("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = os.environ.get("OPENAI_API_KEY", "")

# ── Score cache (avoids re-scoring the same opportunity on repeated scans)
CACHE_FILE     = os.path.join(os.path.dirname(os.path.abspath(__file__)), "score_cache.json")
CACHE_TTL_DAYS = 5
_cache         = {}

def _load_cache():
    global _cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE) as f:
                _cache = json.load(f)
        except Exception:
            _cache = {}

def _save_cache():
    with open(CACHE_FILE, "w") as f:
        json.dump(_cache, f)

def cache_get(opp_id, provider):
    entry = _cache.get(f"{opp_id}:{provider}")
    if not entry:
        return None
    try:
        age = datetime.now() - datetime.fromisoformat(entry["scored_at"])
        if age.days >= CACHE_TTL_DAYS:
            return None
    except Exception:
        return None
    return entry.get("text")

def cache_set(opp_id, provider, text):
    _cache[f"{opp_id}:{provider}"] = {"scored_at": datetime.now().isoformat(), "text": text}
    _save_cache()

_load_cache()

# ── Pre-filter: reject non-tech NAICS + clearance/facilities keywords before any LLM call
NON_TECH_NAICS = {"11","21","23","31","32","33","42","44","45","48","49","71","72","81"}
BLOCKLIST = [
    "ts/sci","top secret/sci","top secret clearance","secret clearance required",
    "security clearance required","clearance required","active clearance",
    "cmmc level 3","cmmc ml3",
    "janitorial","custodial service","grounds maintenance","landscaping service",
    "food service","cafeteria service","hvac maintenance","plumbing repair",
    "aircraft maintenance","vehicle maintenance","fleet maintenance",
    "pest control","snow removal","refuse collection","elevator maintenance",
]

def prefilter(opps):
    kept, rejected = [], 0
    now = datetime.now()
    for o in opps:
        naics = str(o.get("naics") or "")
        if len(naics) >= 2 and naics[:2] in NON_TECH_NAICS:
            rejected += 1
            continue
        text = (o.get("title", "") + " " + o.get("description", "")[:400]).lower()
        if any(phrase in text for phrase in BLOCKLIST):
            rejected += 1
            continue
        # Reject if response deadline expired more than 1 day ago
        # (1-day grace covers in-evaluation opportunities still marked "active")
        # Only check responseDeadLine — archiveDate is not a submission cutoff
        deadline = o.get("deadline", "")
        if deadline:
            try:
                dl = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                if dl.tzinfo is not None:
                    dl = dl.replace(tzinfo=None)
                if dl < now - timedelta(days=1):
                    rejected += 1
                    continue
            except (ValueError, TypeError):
                pass  # Unparseable date — keep it
        kept.append(o)
    print(f"[Pre-filter] Rejected {rejected}, kept {len(kept)}")
    return kept, rejected


def fetch_sam_page(url):
    """Fetch a SAM.gov API page with exponential backoff on rate limit errors."""
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                wait = 2 ** attempt
                print(f"[SAM.gov] Rate limited (HTTP {e.code}) — waiting {wait}s (attempt {attempt + 1}/4)...")
                time.sleep(wait)
                continue
            body = e.read().decode()[:300]
            raise Exception(f"SAM.gov HTTP {e.code}: {body}")
    raise Exception("SAM.gov rate limit exceeded after 4 attempts — try again in a few minutes")


class Handler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Clean up server logs
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] {args[0]} {args[1]}")

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/analyze":
            self.proxy_llm()
        elif parsed.path == "/api/triage":
            self.proxy_triage()
        else:
            self.send_response(404)
            self.end_headers()

    def proxy_triage(self):
        """Stage 1: batch-triage up to 10 opps per call. Returns pass/fail per opp."""
        try:
            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length).decode())
            provider = body.get("provider", "gemini")
            opps     = body.get("opps", [])  # [{id, title, description}, ...]

            if not opps:
                self.respond_json({"results": []})
                return

            lines = []
            for i, o in enumerate(opps):
                desc = (o.get("description") or "")[:500].replace("\n", " ")
                lines.append(f"[{i+1}] Title: {o.get('title','')}\nDesc: {desc}")

            prompt = (
                "Triage these US government solicitations for a solo software developer "
                "(SAM.gov registration only — no clearance, no past performance, no contract vehicle).\n\n"
                "For each rate 0–10:\n"
                "  SW: Can software (web app, API, automation, data pipeline, dashboard, AI/LLM tool, or any other software) directly solve the core task?\n"
                "  ACCESS: Can a solo founder with SAM.gov only realistically bid? "
                "(clearance/CMMC L3/mandatory past-perf/existing vehicle = 0–2)\n\n"
                "Reply ONLY with lines in format:  INDEX|SW|ACCESS  — no other text.\n\n"
                + "\n\n".join(lines)
            )

            if provider == "gemini":
                text = self.call_gemini(prompt)
            elif provider == "claude":
                text = self.call_claude(prompt)
            else:
                text = self.call_openai(prompt)

            # Parse — accept variations like "1|8|7", "**1**|8|7", "1 | 8 | 7"
            results = [{"id": o["id"], "pass": False, "sw": 0, "access": 0} for o in opps]
            for line in text.strip().splitlines():
                m = re.search(r"(\d+)\D+(\d+)\D+(\d+)", line.strip())
                if m:
                    idx, ai, access = int(m.group(1)) - 1, int(m.group(2)), int(m.group(3))
                    if 0 <= idx < len(results):
                        results[idx].update({"sw": ai, "access": access, "pass": ai >= 5 and access >= 4})

            self.respond_json({"results": results})

        except urllib.error.HTTPError as e:
            err_body = e.read().decode()[:400]
            print(f"[ERROR] Triage HTTP {e.code}: {err_body}")
            self.respond_json({"error": f"Triage LLM error {e.code}: {err_body}"}, status=502)
        except Exception as e:
            import traceback; traceback.print_exc()
            self.respond_json({"error": str(e)}, status=500)

    def proxy_llm(self):
        """Route a full-score request to the selected LLM provider. Checks cache first."""
        try:
            length = int(self.headers.get("Content-Length", 0))
            body     = json.loads(self.rfile.read(length).decode())
            provider = body.get("provider", "gemini")
            prompt   = body.get("prompt", "")
            opp_id   = body.get("opp_id", "")

            # ── Cache check
            if opp_id:
                cached = cache_get(opp_id, provider)
                if cached:
                    print(f"[Cache] HIT {opp_id[:24]}")
                    self.respond_json({"text": cached, "from_cache": True})
                    return

            if provider == "gemini":
                text = self.call_gemini(prompt)
            elif provider == "claude":
                text = self.call_claude(prompt)
            elif provider == "openai":
                text = self.call_openai(prompt)
            else:
                self.respond_json({"error": f"Unknown provider: {provider}"}, status=400)
                return

            # ── Debug: log first line of response so truncation is visible in terminal
            preview = text.split('\n')[0] if text else '(empty)'
            print(f"[{provider.upper()}] {preview[:80]}")

            # ── Cache save
            if opp_id:
                cache_set(opp_id, provider, text)

            self.respond_json({"text": text, "from_cache": False})

        except urllib.error.HTTPError as e:
            err_body = e.read().decode()[:400]
            print(f"[ERROR] Analyze HTTP {e.code}: {err_body}")
            self.respond_json({"error": f"LLM API error {e.code}: {err_body}"}, status=502)
        except Exception as e:
            import traceback; traceback.print_exc()
            self.respond_json({"error": str(e)}, status=500)

    def call_gemini(self, prompt):
        if not GEMINI_API_KEY:
            raise Exception("GEMINI_API_KEY not set in .env")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = json.dumps({
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": 4000},
        }).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        parts = data["candidates"][0]["content"]["parts"]
        # Gemini 2.5 Flash is a thinking model — parts[0] may contain thought tokens
        # (marked with "thought": true). Skip those; join only the actual response parts.
        text_parts = [p["text"] for p in parts if "text" in p and not p.get("thought", False)]
        return "\n".join(text_parts)

    def call_claude(self, prompt):
        if not ANTHROPIC_API_KEY:
            raise Exception("ANTHROPIC_API_KEY not set in .env")
        payload = json.dumps({
            "model": "claude-sonnet-4-6",
            "max_tokens": 900,
            "messages": [{"role": "user", "content": prompt}],
        }).encode()
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=payload,
            headers={"Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        return data["content"][0]["text"]

    def call_openai(self, prompt):
        if not OPENAI_API_KEY:
            raise Exception("OPENAI_API_KEY not set in .env")
        payload = json.dumps({
            "model": "gpt-4o",
            "max_tokens": 900,
            "messages": [{"role": "user", "content": prompt}],
        }).encode()
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_API_KEY}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        return data["choices"][0]["message"]["content"]

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # ── Serve frontend HTML
        if path == "/" or path == "/index.html":
            self.serve_file("contract-scanner.html", "text/html")

        # ── SAM.gov proxy endpoint
        elif path == "/api/opportunities":
            self.proxy_sam(params)

        # ── Which LLM providers are configured
        elif path == "/api/config":
            self.respond_json({
                "providers": {
                    "gemini": bool(GEMINI_API_KEY),
                    "claude": bool(ANTHROPIC_API_KEY),
                    "openai": bool(OPENAI_API_KEY),
                }
            })

        # ── Health check
        elif path == "/health":
            self.respond_json({"status": "ok", "sam_key": SAM_API_KEY[:8] + "..." if len(SAM_API_KEY) > 8 else SAM_API_KEY})

        else:
            self.send_response(404)
            self.end_headers()

    def proxy_sam(self, params):
        """Fetch from SAM.gov and return results, paginating up to max_results."""
        try:
            opp_type = params.get("ptype", ["o,k,r,s"])[0]
            posted_days = int(params.get("posted_days", ["14"])[0])
            max_results = min(int(params.get("max_results", ["500"])[0]), 10000)

            today = datetime.now()
            from_date = today - timedelta(days=posted_days)
            fmt = lambda d: d.strftime("%m/%d/%Y")

            all_opps = []
            offset = 0
            batch_size = 100  # SAM.gov max per request

            print(f"[SAM.gov] Fetching active opportunities posted in last {posted_days} days...")

            while len(all_opps) < max_results:
                query = {
                    "api_key": SAM_API_KEY,
                    "ptype": opp_type,
                    "postedFrom": fmt(from_date),
                    "postedTo": fmt(today),
                    "active": "Yes",
                    "limit": min(batch_size, max_results - len(all_opps)),
                    "offset": offset,
                }

                url = f"{SAM_API_BASE}?{urllib.parse.urlencode(query)}"
                print(f"[SAM.gov] Batch request offset={offset}...")

                data = fetch_sam_page(url)

                batch = data.get("opportunitiesData", [])
                if not batch:
                    print(f"[SAM.gov] No more results at offset {offset}")
                    break

                all_opps.extend(batch)
                print(f"[SAM.gov] Got {len(batch)} opportunities (total: {len(all_opps)})")

                if len(batch) < batch_size:
                    break  # Last page
                offset += batch_size

            # Normalize fields
            normalized = []
            for o in all_opps:
                notice_id = o.get("noticeId", "")
                normalized.append({
                    "id": notice_id or o.get("solicitationNumber", ""),
                    "title": (o.get("title") or "Untitled").strip(),
                    "agency": o.get("departmentName") or o.get("organizationHierarchy", [{}])[0].get("name", "Unknown Agency"),
                    "subagency": o.get("subtierName") or "",
                    "type": format_type(o.get("type", "")),
                    "naics": o.get("naicsCode") or "",
                    "postedDate": o.get("postedDate") or "",
                    "deadline": o.get("responseDeadLine") or o.get("archiveDate") or "",
                    "setAside": format_set_aside(o.get("typeOfSetAside") or ""),
                    "description": clean_text(o.get("description") or ""),
                    "url": f"https://sam.gov/opp/{notice_id}/view" if notice_id else "https://sam.gov",
                    "solicitationNumber": o.get("solicitationNumber") or "",
                })

            filtered, rejected = prefilter(normalized)
            print(f"[SAM.gov] Returning {len(filtered)} to frontend ({rejected} pre-filtered)")
            self.respond_json({"count": len(filtered), "pre_filter_rejected": rejected, "opportunities": filtered})

        except Exception as e:
            import traceback; traceback.print_exc()
            self.respond_json({"error": str(e), "opportunities": []}, status=500)

    def serve_file(self, filename, content_type):
        filepath = os.path.join(os.path.dirname(__file__), filename)
        if not os.path.exists(filepath):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"File not found")
            return
        with open(filepath, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", len(content))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(content)

    def respond_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)


def format_type(t):
    m = {"o": "Solicitation", "k": "Combined Synopsis/Solicitation",
         "r": "Pre-Solicitation", "s": "Sources Sought",
         "g": "Sale of Surplus", "i": "Intent to Bundle"}
    return m.get(t, t or "Solicitation")


def format_set_aside(s):
    m = {"SBA": "Small Business", "8A": "8(a)", "SBP": "SB Set-Aside",
         "WOSB": "WOSB", "HZC": "HUBZone", "SDVOSB": "SDVOSB",
         "VSB": "Veteran SB", "EDWOSB": "EDWOSB", "NONE": "Full & Open"}
    return m.get(s, s or "Full & Open")


def clean_text(text):
    import re
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def main():
    print("=" * 55)
    print("  CONTRACT INTEL — Local Server")
    print("=" * 55)
    print(f"  SAM.gov Key:     {'SET ✓' if SAM_API_KEY != 'DEMO_KEY' else 'DEMO_KEY (limited)'}")
    llm_ready = [name for name, key in [("Gemini", GEMINI_API_KEY), ("Claude", ANTHROPIC_API_KEY), ("OpenAI", OPENAI_API_KEY)] if key]
    print(f"  LLM Keys:        {', '.join(llm_ready) if llm_ready else 'none — add to .env'}")
    print(f"  Running at:      http://localhost:{PORT}")
    print(f"  Stop server:     Ctrl+C")
    print("=" * 55)

    if SAM_API_KEY == "DEMO_KEY":
        print("\n  ⚠  DEMO_KEY has very limited rate limits.")
        print("  Get your free API key in 30 seconds:")
        print("  1. Go to https://sam.gov/profile/details")
        print("  2. Click 'Public API Key'")
        print("  3. Run: SAM_API_KEY=your_key python3 server.py\n")

    server = ThreadingHTTPServer(("localhost", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server stopped]")


if __name__ == "__main__":
    main()
