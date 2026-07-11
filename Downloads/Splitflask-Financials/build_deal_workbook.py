"""
Splitflask Deal Workbook — Deliverable B
Investor / Kendra Scott due diligence package.
TWO-DENOMINATOR WALL: Splitflask tumbler GMV only. Zero tax/entity/Cyberbackpack content.
"""

import openpyxl
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()

# ── Color palette (professional, buyer-ready) ─────────────────────────────────
C_NAVY    = "1F3864"   # headers, title backgrounds
C_BLUE    = "2E75B6"   # sub-headers
C_LBLUE   = "BDD7EE"   # alternating row tint
C_VLBLUE  = "DEEAF1"   # lightest tint
C_GREEN   = "375623"   # positive / confirmed values
C_LGREEN  = "E2EFDA"   # green tint rows
C_ORANGE  = "C55A11"   # callout / accent
C_YELLOW  = "FFF2CC"   # preliminary / open items
C_WHITE   = "FFFFFF"
C_LGRAY   = "F2F2F2"
C_MGRAY   = "D6DCE4"

# ── Shared style helpers ──────────────────────────────────────────────────────

def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def font(bold=False, color="000000", size=10, italic=False):
    return Font(bold=bold, color=color, size=size, italic=italic, name="Calibri")

def align(h="left", v="center", wrap=False):
    return Alignment(horizontal=h, vertical=v, wrap_text=wrap)

def border_all(thin=True):
    s = Side(style="thin" if thin else "medium")
    return Border(left=s, right=s, top=s, bottom=s)

def border_bottom():
    s = Side(style="thin")
    return Border(bottom=s)

FMT_USD    = '"$"#,##0'
FMT_USD2   = '"$"#,##0.00'
FMT_PCT    = '0.0%'
FMT_TEXT   = "@"

def set_col_width(ws, col_letter, width):
    ws.column_dimensions[col_letter].width = width

def title_row(ws, row, text, height=30):
    ws.row_dimensions[row].height = height
    c = ws.cell(row=row, column=1, value=text)
    c.font = Font(bold=True, color=C_WHITE, size=14, name="Calibri")
    c.fill = fill(C_NAVY)
    c.alignment = align("left", "center")

def header_row(ws, row, cols, values, bg=C_BLUE):
    ws.row_dimensions[row].height = 18
    for col, val in zip(cols, values):
        c = ws.cell(row=row, column=col, value=val)
        c.font = Font(bold=True, color=C_WHITE, size=10, name="Calibri")
        c.fill = fill(bg)
        c.alignment = align("center", "center", wrap=True)
        c.border = border_all()

def data_row(ws, row, col_vals, bg=C_WHITE, bold=False, fmt=None, align_h="right"):
    for col, val in col_vals:
        c = ws.cell(row=row, column=col, value=val)
        c.font = Font(bold=bold, size=10, name="Calibri")
        c.fill = fill(bg)
        c.alignment = align(align_h, "center")
        c.border = border_all()
        if fmt and isinstance(val, (int, float)):
            c.number_format = fmt

def label_val(ws, row, label_col, label, val_col, val, bg=C_WHITE, fmt=FMT_USD, bold=False):
    lc = ws.cell(row=row, column=label_col, value=label)
    lc.font = Font(bold=bold, size=10, name="Calibri")
    lc.fill = fill(bg)
    lc.alignment = align("left", "center")
    lc.border = border_all()
    vc = ws.cell(row=row, column=val_col, value=val)
    vc.font = Font(bold=bold, size=10, name="Calibri")
    vc.fill = fill(bg)
    vc.alignment = align("right", "center")
    vc.border = border_all()
    if val is not None and isinstance(val, (int, float)):
        vc.number_format = fmt

def note_row(ws, row, col, text, bg=C_YELLOW, col_span=None):
    c = ws.cell(row=row, column=col, value=text)
    c.font = Font(italic=True, size=9, name="Calibri", color="7F6000")
    c.fill = fill(bg)
    c.alignment = align("left", "center", wrap=True)
    ws.row_dimensions[row].height = 24

def spacer(ws, row, cols=8):
    for i in range(1, cols + 1):
        ws.cell(row=row, column=i).fill = fill(C_WHITE)
    ws.row_dimensions[row].height = 8

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

ws1 = wb.active
ws1.title = "Summary"
ws1.sheet_view.showGridLines = False

for col, w in zip("ABCDEFGH", [28, 18, 18, 18, 18, 14, 14, 14]):
    ws1.column_dimensions[col].width = w

# Title block
ws1.merge_cells("A1:H1")
title_row(ws1, 1, "  SPLITFLASK — Commercial Performance Summary")
ws1.merge_cells("A2:H2")
c = ws1.cell(row=2, column=1, value="Splitflask Dual-Chamber Tumbler  |  Confidential  |  For Diligence Use Only")
c.font = Font(italic=True, size=10, color=C_WHITE, name="Calibri")
c.fill = fill(C_BLUE)
c.alignment = align("left", "center")
ws1.row_dimensions[2].height = 16

spacer(ws1, 3)

# ── 3-Year GMV Headline ───────────────────────────────────────────────────────
ws1.merge_cells("A4:H4")
c = ws1.cell(row=4, column=1, value="3-YEAR GMV TRAJECTORY  (Splitflask tumbler only — all channels)")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri")
c.alignment = align("left", "center")
ws1.row_dimensions[4].height = 20

header_row(ws1, 5,
    [1, 2, 3, 4, 5, 6, 7, 8],
    ["Year", "GMV", "YoY Change", "Channel Count", "Status", "On-Air Reference", "Key Narrative", ""]
)

# 2024
data_row(ws1, 6,
    [(1, "2024"), (2, 751891), (3, None), (4, 4), (5, "VERIFIED"), (6, "$895,754 deposits (on-air)"), (7, "Launch year — full channel mix"), (8, "")],
    bg=C_LGREEN, bold=True, fmt=FMT_USD
)
ws1.cell(row=6, column=2).number_format = FMT_USD
ws1.cell(row=6, column=6).number_format = FMT_TEXT
ws1.cell(row=6, column=7).alignment = align("left", "center")

# 2025
data_row(ws1, 7,
    [(1, "2025"), (2, 513987), (3, -0.3162), (4, 4), (5, "VERIFIED"), (6, "$499,000 (on-air ≈ GMV)"), (7, "Transition year — entity restructure; TikTok wind-down"), (8, "")],
    bg=C_WHITE, fmt=FMT_USD
)
ws1.cell(row=7, column=2).number_format = FMT_USD
ws1.cell(row=7, column=3).number_format = FMT_PCT
ws1.cell(row=7, column=7).alignment = align("left", "center")

# 2026 H1
data_row(ws1, 8,
    [(1, "2026 H1 (Jan–Jun)"), (2, 106312), (3, None), (4, 3), (5, "PRELIMINARY ⚠"), (6, "Post-Shark Tank / Kendra"), (7, "Re-acceleration underway; wholesale open"), (8, "")],
    bg=C_YELLOW, fmt=FMT_USD
)
ws1.cell(row=8, column=2).number_format = FMT_USD
ws1.cell(row=8, column=7).alignment = align("left", "center")

# 2026 Conservative Annualized
data_row(ws1, 9,
    [(1, "2026 Conservative Annualized"), (2, 212600), (3, None), (4, None), (5, "LABELED PROJECTION"), (6, "H1 × 2 straight-line"), (7, "NOT adjusting for Shark Tank spike; see tab 2026 Momentum"), (8, "")],
    bg=C_LGRAY, fmt=FMT_USD
)
ws1.cell(row=9, column=2).number_format = FMT_USD
ws1.cell(row=9, column=7).alignment = align("left", "center")

spacer(ws1, 10)

# ── 2024 Demand Waterfall Callout ─────────────────────────────────────────────
ws1.merge_cells("A11:D11")
c = ws1.cell(row=11, column=1, value="2024 DEMAND WATERFALL  (verified, bank + platform sourced)")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri")
c.alignment = align("left", "center")
ws1.row_dimensions[11].height = 20

rows_wf = [
    ("Total deposits through business", 895754, C_WHITE, False, "← All inflows; 2024 on-air reference"),
    ("List-price demand", 1032079, C_LBLUE, False, "Gross consumer demand before promos"),
    ("Promotional discounts", -280188, C_WHITE, False, "Documented promo / discount programs"),
    ("GMV — consumer-paid", 751891, C_LGREEN, True, "LOCKED | 4 channels"),
    ("Net revenue (after platform fees)", 560938, C_WHITE, False, "Bank-tied; fee-substantiated"),
]
for i, (label, val, bg, bold, note) in enumerate(rows_wf):
    r = 12 + i
    ws1.row_dimensions[r].height = 16
    lc = ws1.cell(row=r, column=1, value=label)
    lc.font = Font(bold=bold, size=10, name="Calibri")
    lc.fill = fill(bg); lc.alignment = align("left", "center"); lc.border = border_all()
    vc = ws1.cell(row=r, column=2, value=val)
    vc.font = Font(bold=bold, size=10, name="Calibri")
    vc.fill = fill(bg); vc.alignment = align("right", "center")
    vc.border = border_all(); vc.number_format = FMT_USD
    nc = ws1.cell(row=r, column=3, value=note)
    nc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    nc.fill = fill(bg); nc.alignment = align("left", "center"); nc.border = border_all()
    ws1.merge_cells(f"C{r}:H{r}")

spacer(ws1, 17)

# ── Brand Assets ──────────────────────────────────────────────────────────────
ws1.merge_cells("A18:H18")
c = ws1.cell(row=18, column=1, value="BRAND ASSETS")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri")
c.alignment = align("left", "center")
ws1.row_dimensions[18].height = 20

assets = [
    ("US Patent", "12,577,032 B2", "Dual-chamber tumbler design — issued, held by brand"),
    ("Channels", "Amazon · Shopify · TikTok Shop · Wholesale", "Multi-channel distribution established"),
    ("Wholesale Accounts", "ESP (~$57.6K 2024) · Von Maur · Knocking · SATS", "B2B retail placements; reorders confirmed"),
    ("Retail Expansion", "Best Buy & Walmart via Mirakl (live Dec 2025)", "Nascent; revenue inflecting 2026"),
    ("International", "Amazon MX, CA, SG, AU · Kuwait · AU/JP/TW distributors", "Multi-market footprint; early stage"),
]
for i, (asset, detail, note) in enumerate(assets):
    r = 19 + i
    ws1.row_dimensions[r].height = 16
    ac = ws1.cell(row=r, column=1, value=asset)
    ac.font = Font(bold=True, size=10, name="Calibri")
    ac.fill = fill(C_LGRAY if i % 2 == 0 else C_WHITE)
    ac.alignment = align("left", "center"); ac.border = border_all()
    dc = ws1.cell(row=r, column=2, value=detail)
    dc.font = Font(size=10, name="Calibri")
    dc.fill = fill(C_LGRAY if i % 2 == 0 else C_WHITE)
    dc.alignment = align("left", "center"); dc.border = border_all()
    ws1.merge_cells(f"B{r}:D{r}")
    nc = ws1.cell(row=r, column=5, value=note)
    nc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    nc.fill = fill(C_LGRAY if i % 2 == 0 else C_WHITE)
    nc.alignment = align("left", "center"); nc.border = border_all()
    ws1.merge_cells(f"E{r}:H{r}")

spacer(ws1, 24)

# ── Footer note ───────────────────────────────────────────────────────────────
ws1.merge_cells("A25:H25")
c = ws1.cell(row=25, column=1,
    value="⚠  This workbook covers SPLITFLASK TUMBLER commercial performance only. "
          "No tax figures, entity P&L, losses, or Cyberbackpack content anywhere in this file. "
          "See tab 'Notes & Sources' for denominator definition and verification status.")
c.font = Font(italic=True, size=9, color="7F6000", name="Calibri")
c.fill = fill(C_YELLOW)
c.alignment = align("left", "center", wrap=True)
ws1.row_dimensions[25].height = 24


# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — GMV WATERFALL 2024
# ══════════════════════════════════════════════════════════════════════════════

ws2 = wb.create_sheet("GMV Waterfall 2024")
ws2.sheet_view.showGridLines = False

for col, w in zip("ABCDE", [30, 18, 18, 6, 32]):
    ws2.column_dimensions[col].width = w

ws2.merge_cells("A1:E1")
title_row(ws2, 1, "  2024 DEMAND WATERFALL — Splitflask Tumbler")
ws2.merge_cells("A2:E2")
c = ws2.cell(row=2, column=1, value="Every tier tied to a documented source. Bank-verified + platform-verified. LOCKED.")
c.font = Font(italic=True, size=10, color=C_WHITE, name="Calibri")
c.fill = fill(C_BLUE); c.alignment = align("left", "center")
ws2.row_dimensions[2].height = 16

spacer(ws2, 3)

# Column headers
header_row(ws2, 4, [1, 2, 3, 4, 5], ["Tier", "Amount", "vs GMV", "", "Source / Explanation"])

waterfall = [
    ("Total Deposits Through Business", 895754, None,
     "All inflows to SGM WF …8625 (includes loans, intercompany, transfers). 2024 on-air reference. "
     "Bank-classified line-by-line; $895,754.12 penny-exact."),
    ("List-Price Demand (Gross)", 1032079, None,
     "Consumer demand at full list price, before any promotions. "
     "$1,032,079 = GMV $751,891 + promotional discounts $280,188."),
    ("  Less: Promotional Discounts", -280188, None,
     "Documented discount programs, promo codes, and promotional pricing. Source: platform sales reports."),
    ("GMV — Consumer-Paid", 751891, 1.0,
     "LOCKED. What customers actually paid. 4 channels: Amazon $321,251 · Shopify $188,569 charged · "
     "TikTok Shop $155,295 · Wholesale $86,776."),
    ("  Less: Platform Fees (substantiated)", -190953, None,
     "Amazon referral + FBA $52,007; TikTok stated fees $51,352; Shopify Payments ~$5,276. "
     "Sourced from settlement reports — NOT plugged."),
    ("Net Revenue", 560938, 0.7461,
     "Bank-tied. Ties to reconciled SGM WF …8625 deposits (revenue classification, $581,396 revenue deposits "
     "excl. non-revenue inflows). Consistent with amended return basis."),
]

for i, (label, val, pct, src) in enumerate(waterfall):
    r = 5 + i
    ws2.row_dimensions[r].height = 28
    is_gmv = "GMV — Consumer" in label
    bg = C_LGREEN if is_gmv else (C_LGRAY if i % 2 == 0 else C_WHITE)
    bold = is_gmv

    lc = ws2.cell(row=r, column=1, value=label)
    lc.font = Font(bold=bold, size=10, name="Calibri")
    lc.fill = fill(bg); lc.alignment = align("left", "center"); lc.border = border_all()

    vc = ws2.cell(row=r, column=2, value=val)
    vc.font = Font(bold=bold, size=10, name="Calibri")
    vc.fill = fill(bg); vc.alignment = align("right", "center")
    vc.border = border_all(); vc.number_format = FMT_USD

    pc = ws2.cell(row=r, column=3, value=pct)
    pc.font = Font(size=10, name="Calibri")
    pc.fill = fill(bg); pc.alignment = align("right", "center")
    pc.border = border_all()
    if pct is not None:
        pc.number_format = FMT_PCT

    ws2.cell(row=r, column=4).fill = fill(bg)
    ws2.cell(row=r, column=4).border = border_all()

    sc = ws2.cell(row=r, column=5, value=src)
    sc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    sc.fill = fill(bg); sc.alignment = align("left", "center", wrap=True)
    sc.border = border_all()

spacer(ws2, 11)

# 1099-K note
ws2.merge_cells("A12:E12")
c = ws2.cell(row=12, column=1,
    value="1099-K NOTE: Splitflask 1099-K total = $686,376 (card channels only). "
          "GMV $751,891 > 1099-K because wholesale ($86,776 B2B, no card processor) is not 1099-K'd. "
          "Card-channel GMV $665,115 + 1099-K gross-of-refunds premium $21,261 = 1099-K $686,376. Ties.")
c.font = Font(italic=True, size=9, color="595959", name="Calibri")
c.fill = fill(C_LGRAY); c.alignment = align("left", "center", wrap=True)
ws2.row_dimensions[12].height = 32


# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 — 3-YEAR CHANNEL TREND
# ══════════════════════════════════════════════════════════════════════════════

ws3 = wb.create_sheet("3-Year Channel Trend")
ws3.sheet_view.showGridLines = False

for col, w in zip("ABCDEFG", [24, 16, 16, 16, 12, 12, 28]):
    ws3.column_dimensions[col].width = w

ws3.merge_cells("A1:G1")
title_row(ws3, 1, "  3-YEAR CHANNEL TREND — Splitflask Tumbler GMV by Channel")
ws3.merge_cells("A2:G2")
c = ws3.cell(row=2, column=1,
    value="2024 & 2025 VERIFIED / LOCKED. 2026 H1 PRELIMINARY (platform-sourced, unaudited). "
          "Channel attribution: each sales account confirmed single-product (tumbler only).")
c.font = Font(italic=True, size=10, color=C_WHITE, name="Calibri")
c.fill = fill(C_BLUE); c.alignment = align("left", "center")
ws3.row_dimensions[2].height = 16

spacer(ws3, 3)

header_row(ws3, 4, [1, 2, 3, 4, 5, 6, 7],
    ["Channel", "2024 GMV", "2025 GMV", "2026 H1", "2024 Mix %", "2025 Mix %", "Notes"])

channels = [
    ("Amazon US",        321251, 224155,  80573, 321251/751891, 224155/513987,
     "Net of refunds. 2025 = SPLT acct (nominee-in from SGM). 2026 = SPLT."),
    ("Shopify",          188569, 165177,  23940, 188569/751891, 165177/513987,
     "2024: Splitflask store (Personal TIN). 2025: SPLT TIN. 2026: net of discounts/returns."),
    ("TikTok Shop",      155295,  24510,   1798, 155295/751891,  24510/513987,
     "2024: peak channel. 2025: winding down. 2026: immaterial — channel effectively closed."),
    ("Wholesale / B2B",   86776,  84125,      0,  86776/751891,  84125/513987,
     "ESP, Von Maur, Knocking, SATS in 2024/2025. 2026 wholesale status open (unconfirmed)."),
    ("Intl / Other",          0,  15940,   3000,             0,  15940/513987,
     "2025: Amazon SG/AU $2,383, intl wires $7,686, Best Buy/Walmart $1,111, other. 2026: est."),
    ("TOTAL",            751891, 513987, 109311,          1.0,          1.0, ""),
]

for i, (ch, v24, v25, v26, m24, m25, note) in enumerate(channels):
    r = 5 + i
    is_total = ch == "TOTAL"
    bg = C_LGREEN if is_total else (C_LGRAY if i % 2 == 0 else C_WHITE)
    bold = is_total
    ws3.row_dimensions[r].height = 20

    def cell(col, val, fmt=None, h="right"):
        c = ws3.cell(row=r, column=col, value=val)
        c.font = Font(bold=bold, size=10, name="Calibri")
        c.fill = fill(bg); c.alignment = align(h, "center"); c.border = border_all()
        if fmt and isinstance(val, (int, float)):
            c.number_format = fmt
        return c

    cell(1, ch, h="left")
    cell(2, v24, FMT_USD)
    cell(3, v25, FMT_USD)
    # 2026 H1 — mark wholesale/total as estimates
    v26_display = v26 if v26 > 0 else ("0 (open)" if ch == "Wholesale / B2B" else 0)
    c_26 = ws3.cell(row=r, column=4, value=v26 if isinstance(v26, (int, float)) else 0)
    c_26.font = Font(bold=bold, size=10, name="Calibri", italic=(ch in ("Wholesale / B2B", "Intl / Other")))
    c_26.fill = fill(C_YELLOW if ch in ("Wholesale / B2B", "Intl / Other") else bg)
    c_26.alignment = align("right", "center"); c_26.border = border_all()
    if isinstance(v26, (int, float)):
        c_26.number_format = FMT_USD
    if ch == "Wholesale / B2B":
        c_26.value = None
        c_26.font = Font(italic=True, size=9, name="Calibri", color="7F6000")
        c_26.alignment = align("center", "center")
        ws3.cell(row=r, column=4).value = "open"
    cell(5, m24 if not is_total else 1.0, FMT_PCT)
    cell(6, m25 if not is_total else 1.0, FMT_PCT)
    nc = ws3.cell(row=r, column=7, value=note)
    nc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    nc.fill = fill(bg); nc.alignment = align("left", "center", wrap=True); nc.border = border_all()
    ws3.row_dimensions[r].height = 24

spacer(ws3, 11)

# Year-total call-outs
ws3.merge_cells("A12:G12")
c = ws3.cell(row=12, column=1,
    value="NARRATIVE: 2025 dip = TRANSITION YEAR (entity restructure SGM→SPLT; TikTok wind-down $155K→$25K). "
          "NOT a demand decline — Amazon and Shopify cores held. 2026 re-accelerating post-Shark Tank / Kendra deal; "
          "wholesale + intl open items likely additive. The $86K wholesale channel in 2024/2025 has no 2026 data yet.")
c.font = Font(italic=True, size=9, color=C_NAVY, name="Calibri")
c.fill = fill(C_VLBLUE); c.alignment = align("left", "center", wrap=True)
ws3.row_dimensions[12].height = 36


# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 — 2026 MOMENTUM
# ══════════════════════════════════════════════════════════════════════════════

ws4 = wb.create_sheet("2026 Momentum")
ws4.sheet_view.showGridLines = False

for col, w in zip("ABCDEFG", [16, 16, 16, 16, 16, 12, 30]):
    ws4.column_dimensions[col].width = w

ws4.merge_cells("A1:G1")
title_row(ws4, 1, "  2026 MOMENTUM — Monthly GMV Jan–Jun (PRELIMINARY / Platform-Sourced)")
ws4.merge_cells("A2:G2")
c = ws4.cell(row=2, column=1,
    value="PRELIMINARY — platform dashboard data, not held to tax-grade footing. "
          "Unaudited. Core channels only (Amazon US + Shopify net + TikTok). Wholesale + Intl open.")
c.font = Font(italic=True, size=10, color=C_WHITE, name="Calibri")
c.fill = fill(C_BLUE); c.alignment = align("left", "center")
ws4.row_dimensions[2].height = 16

spacer(ws4, 3)

header_row(ws4, 4, [1, 2, 3, 4, 5, 6, 7],
    ["Month", "Amazon US", "Shopify Net", "TikTok", "Monthly Total", "vs Prior Mo.", "Note"])

monthly = [
    ("Jan 2026",  19514, 12950, 200, "Post-Shark Tank airing halo — spike expected"),
    ("Feb 2026",  11604,  2824, 200, "Halo fades; underlying run-rate establishes"),
    ("Mar 2026",  11182,  2296, 200, ""),
    ("Apr 2026",  10709,  3023, 400, ""),
    ("May 2026",  11719,  1352, 400, "⚠ Global-E intl Shopify pmt $5.4K — may be additive"),
    ("Jun 2026",  16429,  1495, 400, "Amazon Jun strong (highest non-Jan); seasonal?"),
]

prev_total = None
for i, (mo, amz, shp, ttk, note) in enumerate(monthly):
    r = 5 + i
    total = amz + shp + ttk
    is_jan = "Jan" in mo
    bg = C_YELLOW if is_jan else (C_LGRAY if i % 2 == 0 else C_WHITE)
    ws4.row_dimensions[r].height = 18

    for col, val, fmt in [
        (1, mo, FMT_TEXT),
        (2, amz, FMT_USD),
        (3, shp, FMT_USD),
        (4, ttk, FMT_USD),
        (5, total, FMT_USD),
    ]:
        c = ws4.cell(row=r, column=col, value=val)
        c.font = Font(bold=(col == 5), size=10, name="Calibri")
        c.fill = fill(bg); c.alignment = align("right" if col > 1 else "left", "center")
        c.border = border_all()
        if isinstance(val, (int, float)) and col > 1:
            c.number_format = FMT_USD

    # YoY change
    vc = ws4.cell(row=r, column=6, value=((total - prev_total) / prev_total) if prev_total else None)
    vc.font = Font(size=10, name="Calibri")
    vc.fill = fill(bg); vc.alignment = align("right", "center"); vc.border = border_all()
    if prev_total:
        vc.number_format = FMT_PCT

    nc = ws4.cell(row=r, column=7, value=note)
    nc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    nc.fill = fill(bg); nc.alignment = align("left", "center", wrap=True); nc.border = border_all()

    prev_total = total

# Totals row
r = 11
ws4.row_dimensions[r].height = 20
for col, val, fmt, h in [
    (1, "H1 TOTAL (Core Confirmed)", FMT_TEXT, "left"),
    (2, 81157, FMT_USD, "right"),
    (3, 23940, FMT_USD, "right"),
    (4, 1800, FMT_USD, "right"),
    (5, 106897, FMT_USD, "right"),
    (6, None, None, "right"),
    (7, "Amazon US + Shopify net + TikTok. Wholesale + Intl + Global-E open (additive).", FMT_TEXT, "left"),
]:
    c = ws4.cell(row=r, column=col, value=val)
    c.font = Font(bold=True, size=10, name="Calibri")
    c.fill = fill(C_LGREEN); c.alignment = align(h, "center"); c.border = border_all()
    if fmt and isinstance(val, (int, float)):
        c.number_format = FMT_USD

spacer(ws4, 12)

# Run-rate summary
ws4.merge_cells("A13:G13")
c = ws4.cell(row=13, column=1, value="RUN-RATE ANALYSIS (LABELED PROJECTIONS — preliminary, conservative)")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri")
c.alignment = align("left", "center")
ws4.row_dimensions[13].height = 20

rr_rows = [
    ("Simple H1 × 2 Annualized", 212600, "Straight-line; distorted upward by Jan Shark Tank spike. "
     "Use as CEILING, not run-rate."),
    ("Last-3-Month Avg (Apr–Jun)", 15309, "Monthly avg post-halo. More representative baseline."),
    ("Last-3-Month Annualized", 183700, "Conservative honest current run-rate (core channels, "
     "no wholesale/intl/Global-E). Jun uptick may signal acceleration."),
    ("+ Wholesale (est. if active)", 84000, "2025 wholesale ~$84K; 2026 status OPEN. "
     "Add if confirmed — would lift run-rate $255–280K+."),
]

for i, (label, val, note) in enumerate(rr_rows):
    r = 14 + i
    ws4.row_dimensions[r].height = 20
    is_last3 = "Last-3-Month Ann" in label
    bg = C_LGREEN if is_last3 else (C_LGRAY if i % 2 == 0 else C_WHITE)

    lc = ws4.cell(row=r, column=1, value=label)
    lc.font = Font(bold=is_last3, size=10, name="Calibri")
    lc.fill = fill(bg); lc.alignment = align("left", "center"); lc.border = border_all()
    ws4.merge_cells(f"A{r}:A{r}")

    vc = ws4.cell(row=r, column=2, value=val)
    vc.font = Font(bold=is_last3, size=10, name="Calibri")
    vc.fill = fill(bg); vc.alignment = align("right", "center")
    vc.border = border_all(); vc.number_format = FMT_USD

    nc = ws4.cell(row=r, column=3, value=note)
    nc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    nc.fill = fill(bg); nc.alignment = align("left", "center", wrap=True); nc.border = border_all()
    ws4.merge_cells(f"C{r}:G{r}")

spacer(ws4, 18)

ws4.merge_cells("A19:G19")
c = ws4.cell(row=19, column=1,
    value="CONTEXT: Shark Tank episode aired Jan 2026 → spike in Jan. The deal with Kendra Scott IS the growth "
          "catalyst — do not annualize Shark Tank halo months as a sustainable run-rate. "
          "H1 ACTUAL is the unimpeachable figure. Projection = under-claimed; actuals speak for themselves.")
c.font = Font(italic=True, size=9, color="7F6000", name="Calibri")
c.fill = fill(C_YELLOW); c.alignment = align("left", "center", wrap=True)
ws4.row_dimensions[19].height = 36


# ══════════════════════════════════════════════════════════════════════════════
# TAB 5 — CHANNEL / DEMAND DETAIL
# ══════════════════════════════════════════════════════════════════════════════

ws5 = wb.create_sheet("Channel & Demand Detail")
ws5.sheet_view.showGridLines = False

for col, w in zip("ABCDE", [28, 18, 18, 12, 30]):
    ws5.column_dimensions[col].width = w

ws5.merge_cells("A1:E1")
title_row(ws5, 1, "  CHANNEL & DEMAND DETAIL — 2024 (Verified) and 2025 (Verified)")
ws5.merge_cells("A2:E2")
c = ws5.cell(row=2, column=1,
    value="Per-channel GMV with source cross-check. 1099-K floors independently verified to the penny.")
c.font = Font(italic=True, size=10, color=C_WHITE, name="Calibri")
c.fill = fill(C_BLUE); c.alignment = align("left", "center")
ws5.row_dimensions[2].height = 16

spacer(ws5, 3)

# ── 2024 Channel Detail ───────────────────────────────────────────────────────
ws5.merge_cells("A4:E4")
c = ws5.cell(row=4, column=1, value="2024 — CHANNEL GMV DETAIL (LOCKED)")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri"); c.alignment = align("left", "center")
ws5.row_dimensions[4].height = 20

header_row(ws5, 5, [1, 2, 3, 4, 5],
    ["Channel", "2024 GMV", "1099-K Verified", "Fee Rate", "Source / Notes"])

ch24 = [
    ("Amazon US", 321251, 344036, 0.151,
     "1099-K $344,036 (gross-of-refunds). Net-of-returns GMV $321,251. "
     "Fees: referral $32,863 + FBA $19,144 = $52,007 (15.1%) — stated from settlement."),
    ("Shopify (Splitflask store)", 188569, 164614, 0.029,
     "1099-K $164,614 (Personal TIN …7639). Charged $188,569; settled $181,912. "
     "Shopify Payments fee ~2.9% ($5,276). Capital repayment excluded (non-deductible principal)."),
    ("TikTok Shop", 155295, 155295, 0.331,
     "1099-K $155,295 verified penny-perfect across nine monthly CSVs. "
     "Deductible seller fees 33.1% = platform fees $22,343 + net shipping $27,964 + ad top-up $1,045."),
    ("Wholesale / B2B", 86776, 0, None,
     "No card processor → no 1099-K. ESP ~$57.6K · Von Maur ~$7.2K · Knocking ~$11.3K · SATS ~$10.7K. "
     "Invoice-backed; bank deposits confirmed."),
    ("TOTAL 2024", 751891, 686376, None,
     "1099-K total $686,376 (card channels). GMV $751,891 > 1099-K by $65,515 = wholesale no-card. ✓"),
]

for i, (ch, gmv, ttk, fee, note) in enumerate(ch24):
    r = 6 + i
    is_total = "TOTAL" in ch
    bg = C_LGREEN if is_total else (C_LGRAY if i % 2 == 0 else C_WHITE)
    ws5.row_dimensions[r].height = 28

    for col, val, fmt, h in [
        (1, ch, FMT_TEXT, "left"),
        (2, gmv, FMT_USD, "right"),
        (3, ttk if ttk else None, FMT_USD, "right"),
        (4, fee, FMT_PCT, "right"),
        (5, note, FMT_TEXT, "left"),
    ]:
        c5 = ws5.cell(row=r, column=col, value=val)
        c5.font = Font(bold=is_total, size=10 if col < 5 else 9, name="Calibri",
                       italic=(col == 5))
        c5.fill = fill(bg); c5.alignment = align(h, "center", wrap=(col == 5))
        c5.border = border_all()
        if fmt and isinstance(val, (int, float)):
            c5.number_format = fmt

spacer(ws5, 11)

# ── 2025 Channel Detail ───────────────────────────────────────────────────────
ws5.merge_cells("A12:E12")
c = ws5.cell(row=12, column=1, value="2025 — CHANNEL GMV DETAIL (VERIFIED)")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri"); c.alignment = align("left", "center")
ws5.row_dimensions[12].height = 20

header_row(ws5, 13, [1, 2, 3, 4, 5],
    ["Channel", "2025 GMV", "1099-K Verified", "Entity", "Source / Notes"])

ch25 = [
    ("Amazon US (SPLT)", 224789, 240010, "SPLT",
     "Nominee income: Amazon 1099-K on SGM TIN; economically SPLT (account moved Feb 4, 2025). "
     "SGM nominees $224,789.09 to SPLT. Cross-verified: bank deposits confirm Feb-4 cutoff."),
    ("Shopify (Splitflask store)", 165177, 109064, "SPLT",
     "1099-K $109,064 (SPLT TIN …4308 — TIN switch from Personal in 2024). "
     "GMV basis: net sales from Shopify export."),
    ("TikTok Shop", 24510, 0, "SPLT",
     "Wound down 2025. No 1099-K issued (below threshold after wind-down). "
     "Gross $24,510 from TikTok financial summaries (Q1+Q2 2025)."),
    ("Wholesale / B2B (SGM)", 84125, 0, "SGM",
     "SGM wind-down entity retained wholesale accounts. B2B invoicing; bank-classified. Estimate."),
    ("Amazon SGM (pre-switch)", 15221, 0, "SGM",
     "SGM-earned Amazon orders Jan 1–Feb 4 before account switch. Order-date sourced."),
    ("Intl + Other", 10269, 0, "SPLT",
     "Amazon SG/AU $2,383 · intl wires $7,686 · Best Buy/Walmart (Mirakl) $1,111 — live Dec 2025."),
    ("TOTAL 2025", 513987, None, None,
     "Splitflask tumbler only. Cyberbackpack excluded (separate product, separate entity). "
     "Kickstarter $54,386 = deferred revenue (not yet fulfilled Dec 31) — NOT in GMV."),
]

for i, (ch, gmv, ttk, entity, note) in enumerate(ch25):
    r = 14 + i
    is_total = "TOTAL" in ch
    bg = C_LGREEN if is_total else (C_LGRAY if i % 2 == 0 else C_WHITE)
    ws5.row_dimensions[r].height = 28

    for col, val, fmt, h in [
        (1, ch, FMT_TEXT, "left"),
        (2, gmv, FMT_USD, "right"),
        (3, ttk if ttk else None, FMT_USD, "right"),
        (4, entity, FMT_TEXT, "center"),
        (5, note, FMT_TEXT, "left"),
    ]:
        c5 = ws5.cell(row=r, column=col, value=val)
        c5.font = Font(bold=is_total, size=10 if col < 5 else 9, name="Calibri",
                       italic=(col == 5))
        c5.fill = fill(bg); c5.alignment = align(h, "center", wrap=(col == 5))
        c5.border = border_all()
        if fmt and isinstance(val, (int, float)):
            c5.number_format = fmt

spacer(ws5, 21)

# List-price demand bridge
ws5.merge_cells("A22:E22")
c = ws5.cell(row=22, column=1, value="2024 LIST-PRICE DEMAND BRIDGE (the big top-line number)")
c.font = Font(bold=True, size=11, color=C_NAVY, name="Calibri"); c.alignment = align("left", "center")
ws5.row_dimensions[22].height = 20

bridge = [
    ("List-price demand (consumer demand at full price)", 1032079,
     "What customers would have paid at list. Larger, legitimate metric."),
    ("Less: Promotional discounts", -280188,
     "Promo codes, discount programs. This is a STRENGTH — shows promotional discipline, not weakness."),
    ("= GMV (consumer-paid)", 751891,
     "LOCKED. What customers actually paid after promos."),
]
for i, (label, val, note) in enumerate(bridge):
    r = 23 + i
    is_gmv = "GMV" in label
    bg = C_LGREEN if is_gmv else (C_LGRAY if i % 2 == 0 else C_WHITE)
    ws5.row_dimensions[r].height = 20

    lc = ws5.cell(row=r, column=1, value=label)
    lc.font = Font(bold=is_gmv, size=10, name="Calibri")
    lc.fill = fill(bg); lc.alignment = align("left", "center"); lc.border = border_all()

    vc = ws5.cell(row=r, column=2, value=val)
    vc.font = Font(bold=is_gmv, size=10, name="Calibri")
    vc.fill = fill(bg); vc.alignment = align("right", "center")
    vc.border = border_all(); vc.number_format = FMT_USD

    nc = ws5.cell(row=r, column=3, value=note)
    nc.font = Font(italic=True, size=9, name="Calibri", color="595959")
    nc.fill = fill(bg); nc.alignment = align("left", "center", wrap=True); nc.border = border_all()
    ws5.merge_cells(f"C{r}:E{r}")


# ══════════════════════════════════════════════════════════════════════════════
# TAB 6 — NOTES & SOURCES
# ══════════════════════════════════════════════════════════════════════════════

ws6 = wb.create_sheet("Notes & Sources")
ws6.sheet_view.showGridLines = False

for col, w in zip("ABC", [30, 30, 40]):
    ws6.column_dimensions[col].width = w

ws6.merge_cells("A1:C1")
title_row(ws6, 1, "  NOTES & SOURCES — Denominator Definition and Verification")
ws6.row_dimensions[1].height = 28

spacer(ws6, 2)

sections = [
    ("DENOMINATOR DEFINITION", [
        ("Splitflask GMV — DEAL universe",
         "Splitflask dual-chamber tumbler ONLY. Includes: Amazon US/MX/CA, "
         "Shopify Splitflask store, TikTok Shop Splitflask, Wholesale/B2B invoicing, "
         "Amazon SG/AU, international distributor wires. "
         "EXCLUDES: Cyberbackpack product, Cyberbrands store/entity, consulting income, "
         "loans, transfers, and any non-tumbler line."),
        ("What is NOT in this workbook",
         "No entity taxable income, no P&L losses, no deductions, no tax amendments, "
         "no Cyberbackpack, no Cyberbrands content. Those are in separate tax-compliance "
         "deliverables for the CPA. This file = brand commercial performance only."),
        ("Two-Denominator Wall",
         "This project maintains two separate denominators: (1) Splitflask GMV for Kendra / deal "
         "audience — this file. (2) Total gross receipts for IRS/amendment audience — separate. "
         "Cyberbackpack is the dividing line. It was a separate product on a separate platform "
         "account under a separate entity; it is fully excluded from every figure here."),
    ]),
    ("VERIFICATION STATUS", [
        ("2024 GMV $751,891 — LOCKED",
         "Bank-verified (deposits $895,754.12 penny-exact, 2,022 transactions classified + footed). "
         "1099-K floors independently verified to the penny across all nine 2024 forms. "
         "Channel splits from platform settlement reports and sales dashboards. "
         "Wholesale from B2B invoices and bank wire matching."),
        ("2025 GMV $513,987 — VERIFIED",
         "Amazon: order-date dashboard (Feb 4 cutoff verified). Shopify: export. "
         "TikTok: financial summary PDFs Q1+Q2. Wholesale: SGM bank classification. "
         "Intl: bank wires + dashboard. Nominee income treatment per IRS guidance (SGM→SPLT). "
         "SPLT 2025 bank statements: all months footed per-statement."),
        ("2026 H1 ~$106K — PRELIMINARY",
         "Platform-sourced (Amazon Sales Dashboard, Shopify export, TikTok PDFs). "
         "NOT held to tax-grade footing/reconciliation standard. Unaudited. "
         "Open items: (1) Global-E international Shopify — may add $20–40K if outside Shopify export. "
         "(2) Wholesale 2026 status unknown — $84K channel in 2025; unconfirmed in H1 2026. "
         "(3) Amazon MX/CA — bank estimate only (~$3K). These are additive if confirmed."),
        ("1099-K Verification",
         "Nine 2024 1099-K forms verified to the penny. Splitflask total: $686,376.39. "
         "Cyberbackpack total: $104,678.41. Sum $791,054.80. Every form matched; zero variance. "
         "Product attribution confirmed by account-level mapping (each account = single product)."),
    ]),
    ("KEY FIGURES — CROSS-REFERENCE", [
        ("2024 on-air claim ~$895,000",
         "Attaches to DEPOSITS tier ($895,754.12 bank-verified). NOT GMV. "
         "Deposits > GMV because deposits include loans, intercompany, refund reversals."),
        ("2025 on-air claim ~$499,000",
         "Attaches to GMV tier ($513,987 ≈ $499K, within 2.9%). On-air was conservative vs actual GMV."),
        ("US Patent 12,577,032 B2",
         "Dual-chamber tumbler design. Issued, held by brand. "
         "Valuation range ($100K conservative to ~$2M potential) — open item for diligence."),
    ]),
    ("SOURCE DOCUMENTS", [
        ("Amazon Sales Dashboard + Unified Transaction CSV",
         "Per-year product sales; order-date basis; SKU-level (all tumbler variants confirmed)."),
        ("Shopify Total Sales Breakdown Export",
         "Per-month gross/net sales; returns; discounts. Split by store (Splitflask vs Cyberbrands)."),
        ("TikTok Seller Center Financial Summary PDFs",
         "Quarterly gross/net/payout. Nine monthly 1099-K CSVs summed to $155,294.96 exactly (2024)."),
        ("Wells Fargo Bank Statements",
         "SGM …8625, SPLT …0423, Cyberbrands …5090, Personal …7282 (excluded). "
         "85 PDF files → 65 canonical (20 true duplicates removed). All statements footed per-statement."),
        ("1099-K Tax Forms",
         "Nine forms, two tax years. Original + corrected (corrected supersedes). All verified to source."),
        ("Facebook Ads Invoice (2024 + 2025)",
         "Card-level attribution of ad spend. 2024: $13,018 total. 2025: $97,769 total. "
         "Card→entity mapping for per-entity attribution (not in this deal file — for tax use only)."),
    ]),
]

cur_row = 3
for section_title, items in sections:
    ws6.merge_cells(f"A{cur_row}:C{cur_row}")
    c = ws6.cell(row=cur_row, column=1, value=section_title)
    c.font = Font(bold=True, size=11, color=C_WHITE, name="Calibri")
    c.fill = fill(C_BLUE); c.alignment = align("left", "center")
    ws6.row_dimensions[cur_row].height = 20
    cur_row += 1

    for i, (label, text) in enumerate(items):
        bg = C_LGRAY if i % 2 == 0 else C_WHITE
        lc = ws6.cell(row=cur_row, column=1, value=label)
        lc.font = Font(bold=True, size=10, name="Calibri")
        lc.fill = fill(bg); lc.alignment = align("left", "top"); lc.border = border_all()

        tc = ws6.cell(row=cur_row, column=2, value=text)
        tc.font = Font(size=9, name="Calibri")
        tc.fill = fill(bg); tc.alignment = align("left", "top", wrap=True); tc.border = border_all()
        ws6.merge_cells(f"B{cur_row}:C{cur_row}")
        ws6.row_dimensions[cur_row].height = 48
        cur_row += 1

    cur_row += 1  # spacer

# Final disclaimer
ws6.merge_cells(f"A{cur_row}:C{cur_row}")
c = ws6.cell(row=cur_row, column=1,
    value="CONFIDENTIAL — Prepared for Kendra Scott / investor due diligence. "
          "For information purposes only. Figures represent management's best reconstruction "
          "from source documents. 2026 data preliminary and unaudited. "
          "This document does not constitute audited financial statements.")
c.font = Font(italic=True, size=9, color="7F6000", name="Calibri")
c.fill = fill(C_YELLOW); c.alignment = align("left", "center", wrap=True)
ws6.row_dimensions[cur_row].height = 36

# ── Save ──────────────────────────────────────────────────────────────────────
out_path = "/Users/riz/Downloads/Splitflask-Financials/deliverables/Splitflask_Deal_Workbook.xlsx"
wb.save(out_path)
print(f"Saved: {out_path}")
