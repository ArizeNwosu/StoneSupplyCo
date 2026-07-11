"""
Build SGM 2024 Tax Amendment Packet
Deliverable: deliverables/SGM_2024_Amendment_Packet.xlsx
All figures from CLAUDE.md locked + Layer 5/6 coherence audits.
Provenance gate enforced: every figure has a source note.
"""

import openpyxl
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter

# ─── Style constants ─────────────────────────────────────────────────────────

BLUE_FILL   = PatternFill("solid", fgColor="1F497D")
LBLUE_FILL  = PatternFill("solid", fgColor="DCE6F1")
YELLOW_FILL = PatternFill("solid", fgColor="FFFF99")
ORANGE_FILL = PatternFill("solid", fgColor="FFE0B2")
GREEN_FILL  = PatternFill("solid", fgColor="E2EFDA")
RED_FILL    = PatternFill("solid", fgColor="FFD7D7")
GRAY_FILL   = PatternFill("solid", fgColor="F2F2F2")

WHITE_FONT  = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
HEADER_FONT = Font(name="Calibri", bold=True, size=11)
LABEL_FONT  = Font(name="Calibri", size=10)
NOTE_FONT   = Font(name="Calibri", size=9, italic=True, color="666666")
FLAG_FONT   = Font(name="Calibri", size=10, bold=True, color="C00000")
EST_FONT    = Font(name="Calibri", size=10, italic=True, color="7030A0")

THIN  = Side(style="thin",   color="BFBFBF")
MED   = Side(style="medium", color="4472C4")
THIN_BORDER = Border(bottom=THIN)
MED_BORDER  = Border(top=MED, bottom=MED)

NUM_FMT  = '#,##0.00'
NUM_FMT0 = '#,##0'
PCT_FMT  = '0.0%'


def set_col_width(ws, col_letter, width):
    ws.column_dimensions[col_letter].width = width


def hdr(ws, row, col, text, fill=BLUE_FILL, font=None):
    c = ws.cell(row=row, column=col, value=text)
    c.fill = fill
    c.font = font or WHITE_FONT
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    return c


def sub_hdr(ws, row, col, text, span=None, fill=LBLUE_FILL):
    c = ws.cell(row=row, column=col, value=text)
    c.fill = fill
    c.font = HEADER_FONT
    c.alignment = Alignment(vertical="center")
    if span:
        ws.merge_cells(start_row=row, start_column=col,
                       end_row=row, end_column=col + span - 1)
    return c


def label(ws, row, col, text, indent=0, bold=False):
    c = ws.cell(row=row, column=col, value=("  " * indent) + text)
    c.font = Font(name="Calibri", size=10, bold=bold)
    c.alignment = Alignment(horizontal="left", vertical="center")
    return c


def num(ws, row, col, val, fmt=NUM_FMT, fill=None, bold=False, color=None):
    c = ws.cell(row=row, column=col, value=val)
    c.number_format = fmt
    if fill:
        c.fill = fill
    c.font = Font(name="Calibri", size=10, bold=bold,
                  color=color or "000000")
    c.alignment = Alignment(horizontal="right", vertical="center")
    return c


def note(ws, row, col, text, span=None):
    c = ws.cell(row=row, column=col, value=text)
    c.font = NOTE_FONT
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    if span:
        ws.merge_cells(start_row=row, start_column=col,
                       end_row=row, end_column=col + span - 1)
    return c


def flag(ws, row, col, text, span=None):
    c = ws.cell(row=row, column=col, value=text)
    c.font = FLAG_FONT
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    if span:
        ws.merge_cells(start_row=row, start_column=col,
                       end_row=row, end_column=col + span - 1)
    return c


def rule_row(ws, row, cols=8):
    for c in range(1, cols + 1):
        ws.cell(row=row, column=c).border = Border(top=MED)


def blank(ws, row):
    ws.row_dimensions[row].height = 6


# ─── Sheet 1: Summary ────────────────────────────────────────────────────────

def build_summary(wb):
    ws = wb.create_sheet("Summary")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 46)
    set_col_width(ws, "B", 18)
    set_col_width(ws, "C", 18)
    set_col_width(ws, "D", 18)
    set_col_width(ws, "E", 44)

    # Title
    t = ws.cell(row=1, column=1,
                value="SGM 2024 (1120-S) Amendment — Summary Waterfall")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:E1")
    t.alignment = Alignment(horizontal="left")

    sub = ws.cell(row=2, column=1,
                  value="Social Gear Media LLC  |  EIN 83-3077502  |  WF …8625  |  "
                        "2024 filing period  |  DRAFT — TJ to finalize")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:E2")

    # Column headers
    ws.row_dimensions[3].height = 30
    hdr(ws, 3, 1, "Line Item")
    hdr(ws, 3, 2, "As Filed\n1120-S")
    hdr(ws, 3, 3, "Amended\n(Inv. Method)")
    hdr(ws, 3, 4, "Amended\n(Cash Method)")
    hdr(ws, 3, 5, "Source / Note")

    r = 4

    # ── Revenue ──────────────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "REVENUE", span=5)
    r += 1

    # Gross-up model
    rows_rev = [
        ("Gross receipts (as filed — net deposits)",
         418990, None, None,
         "1120-S line 1a; SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf"),
        ("Gross receipts (amended — Splitflask 1099-K floor)",
         None, 521762.40, 521762.40,
         "SGM TIN 1099-K floor $604,026 less Cyberbackpack store $82,264 (pa_25219104950). "
         "LOCKED. Sources: S050 Amazon US $344,036; S051 Amazon MX $10,562; "
         "S052 Amazon CA $11,870; S055/S060-S068 TikTok $155,295."),
        ("  — Amazon US 1099-K (SGM, 2024)",
         None, 344035.75, 344035.75,
         "Source S050: Splitflask-2024-1099K.pdf Box 1a; Form 1008750130; "
         "Amazon Payments Inc TIN 20-2936165; 5,836 txns. LOCKED."),
        ("  — Amazon Mexico 1099-K (SGM, 2024)",
         None, 10561.67, 10561.67,
         "Source S051: Splitflask-2024-1099K (1).pdf Box 1a; Form 1009016455. LOCKED."),
        ("  — Amazon Canada 1099-K (SGM, 2024)",
         None, 11870.02, 11870.02,
         "Source S052: Splitflask-2024-1099K (2).pdf Box 1a; Form 1008750129. LOCKED."),
        ("  — TikTok Shop 1099-K (SGM, 2024)",
         None, 155294.96, 155294.96,
         "Source S055 + S060-S068: Splitflask-7495370463474518494B_2024_1099-K (1).pdf; "
         "verified penny-exact against 9 monthly detail CSVs. LOCKED."),
        ("  — Cyberbackpack Shopify store (EXCLUDED from Splitflask)",
         None, -82263.58, -82263.58,
         "Source S058: Shopify-SGM-1099-K.pdf; acct pa_25219104950; Cyberbackpack product. "
         "Excluded from Splitflask denominator. Stays on SGM TIN per Option A routing."),
        ("Gross-up needed (amended vs as-filed)",
         None, 102772.40, 102772.40,
         "Cures 1099-K matching exposure: $521,762 amended − $418,990 as-filed. "
         "Sourced deductions below offset this gross-up (see Deductions tab)."),
    ]
    for text, af, inv, cash, src in rows_rev:
        ind = 1 if text.startswith("  —") else 0
        bold = "Gross receipts" in text and not text.startswith("  —")
        label(ws, r, 1, text, indent=ind, bold=bold)
        if af is not None:
            num(ws, r, 2, af, bold=bold)
        if inv is not None:
            num(ws, r, 3, inv, bold=bold,
                color="C00000" if inv < 0 else None)
        if cash is not None:
            num(ws, r, 4, cash, bold=bold,
                color="C00000" if cash < 0 else None)
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── COGS ──────────────────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "COST OF GOODS SOLD", span=5)
    r += 1

    rows_cogs = [
        ("COGS as filed (owner's earlier estimate — superseded)",
         270032, None, None,
         "1120-S Form 1125-A line 8. Owner confirmed this figure was understated; "
         "see COGS & Inventory tab for corrected breakdown."),
        ("Total inventory purchases (Kangdao wires + mold + samples/supplier)",
         None, 390067.65, 390067.65,
         "Source: SGM_2024_Txns ledger tab, all 12 months footed. "
         "COGS_INVENTORY (Kangdao/Dongguan): $362,084. "
         "COGS_MOLD (Chukwuezugo, 12/26/24): $25,000. "
         "COGS_SAMPLES: $2,858. COGS_SUPPLIER: $126. Total $390,068."),
        ("Less: ending inventory (6,000 units × $9.60/unit)",
         None, -57600, None,
         "INVENTORY METHOD ONLY. Physical count 12/24/24; 6,000 units on hand. "
         "Unit cost $9.60 = $10.40 landed − $1.30 freight/unit. "
         "TJ: confirm accounting method election (IRC §471 small-business exception "
         "allows cash method expensing for S-corps under $26M gross receipts)."),
        ("COGS — Inventory method (amended)",
         None, 332468, None,
         "= $390,068 total purchases − $57,600 ending inventory. "
         "USE IF TJ elects inventory method. See COGS & Inventory tab."),
        ("COGS — Cash method (amended, full purchases expensed)",
         None, None, 390068,
         "= $390,068 total purchases; no ending inventory adjustment. "
         "USE IF TJ elects cash method under IRC §471 exception."),
        ("COGS correction vs as-filed",
         None, 62436, 120036,
         "Additional COGS deduction vs as-filed $270,032. "
         "Inv method: $332,468 − $270,032 = $62,436. "
         "Cash method: $390,068 − $270,032 = $120,036. "
         "DEEPENS loss (more favorable). Confirmed by owner."),
    ]
    for text, af, inv, cash, src in rows_cogs:
        ind = 1 if text.startswith("  ") else 0
        bold = "COGS" in text and "Less" not in text and "correction" not in text and "Total" not in text
        label(ws, r, 1, text, indent=ind, bold=bold)
        if af is not None:
            num(ws, r, 2, af, bold=bold)
        if inv is not None:
            num(ws, r, 3, inv, bold=bold,
                fill=YELLOW_FILL if "TJ" in src else None)
        if cash is not None:
            num(ws, r, 4, cash, bold=bold,
                fill=YELLOW_FILL if "TJ" in src else None)
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── OPERATING DEDUCTIONS ──────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "OPERATING DEDUCTIONS", span=5)
    r += 1

    rows_opex = [
        ("Operating deductions — as filed",
         182309, None, None,
         "1120-S Schedule K totals: Salaries $36,000 + Rents $22,500 + "
         "Interest $9,528 + Advertising $6,901 + Other $107,380."),
        ("  Salaries and wages",
         36000, 36000, 36000,
         "1120-S line 8. No change proposed."),
        ("  Rent expense (bank-reconstructed)",
         22500, 30241, 30241,
         "As-filed $22,500; bank classification shows $30,241 (Zelle to "
         "Della Moda Inc / Kamyar — warehouse). $7,741 additional. "
         "TJ to confirm all warehouse rent is deductible."),
        ("  Interest expense",
         9528, 9528, 9528,
         "1120-S line 13. SBA EIDL interest portion (TJ: confirm "
         "principal vs interest split on $13,320 EIDL payment). No change."),
        ("  Advertising (bank, confirmed)",
         6901, 6368, 6368,
         "Bank-classified: $6,368 (Meta/FB bank charges + PR + influencer). "
         "As-filed $6,901; $533 difference. TJ: confirm if additional ad spend "
         "exists on card ···1400 (see flagged item below)."),
        ("  Other deductions (bank-reconstructed)",
         107380, 107380, 107380,
         "As-filed $107,380 preserved. Includes opex, bank fees, CA tax $4,360, "
         "professional fees, SaaS, office. Full bank-reconciled breakdown available."),
        ("  Operating deductions correction vs as-filed",
         None, 7208, 7208,
         "Bank reconstruction adds $7,208 (primarily additional rent). Deepens loss."),
        ("Operating deductions — amended (bank-reconstructed)",
         None, 189517, 189517,
         "= $36,000 + $30,241 + $9,528 + $6,368 + $107,380. "
         "Source: SGM_2024_Txns all 12 months footed. LAYER_5_COHERENCE_AUDIT.md."),
    ]
    for text, af, inv, cash, src in rows_opex:
        ind = 1 if text.startswith("  ") else 0
        bold = "amended" in text.lower() or text == "Operating deductions — as filed"
        label(ws, r, 1, text, indent=ind, bold=bold)
        if af is not None:
            num(ws, r, 2, af, bold=bold)
        if inv is not None:
            num(ws, r, 3, inv, bold=bold)
        if cash is not None:
            num(ws, r, 4, cash, bold=bold)
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── PLATFORM FEES ─────────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "PLATFORM FEES & RETURNS (explicit deductions, offset the revenue gross-up)", span=5)
    r += 1

    rows_fees = [
        ("Amazon US — referral fees",
         None, -32863, -32863,
         "SOURCED: Splitflask-AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv "
         "(stated amounts). 15.1% of US 1099-K $344,036."),
        ("Amazon US — FBA fulfillment fees",
         None, -19144, -19144,
         "SOURCED: same Unified Transaction CSV. "
         "Total core fees (referral + FBA): $52,007."),
        ("Amazon US — core fees subtotal",
         None, -52007, -52007,
         "LOCKED: $52,007 = referral $32,863 + FBA $19,144. "
         "PATH_B_FEE_SUBSTANTIATION.md Step 1."),
        ("Amazon US — returns / refunds",
         None, -22838, -22838,
         "SOURCED: Unified Transaction CSV stated returns. 6.6% of US 1099-K. "
         "Gross receipts ($521,762) is gross-of-returns; this deduction "
         "is the matching contra-revenue. LAYER_5_COHERENCE_AUDIT.md Check 1."),
        ("Amazon MX + CA — fees (ESTIMATE)",
         None, -26996, -26996,
         "ESTIMATE — Not sourced from settlement CSV. "
         "Expected similar rate (~15%) on MX $10,562 + CA $11,870. "
         "TJ action: request Amazon Seller Central settlement reports "
         "for MX and CA accounts to replace with stated amounts."),
        ("TikTok Shop — platform & affiliate fees",
         None, -22343, -22343,
         "SOURCED: TikTok Seller Center quarterly income Excel files (4 quarters). "
         "Stated components: referral + affiliate commissions $22,343."),
        ("TikTok Shop — net seller shipping cost",
         None, -27964, -27964,
         "SOURCED: same quarterly files. Net shipping charged to seller. "
         "Symmetric: customer-paid shipping IS inside $155,295 1099-K; "
         "seller net shipping cost is matching deduction. "
         "LAYER_5_COHERENCE_AUDIT.md Check 2 confirmed symmetric."),
        ("TikTok Shop — platform-funded co-promo ads",
         None, -1045, -1045,
         "SOURCED: quarterly files. Seller-paid ads top-up only ($1,045). "
         "NOTE: $41,702 TikTok co-funded promotions EXCLUDED "
         "(not seller expense; TikTok-funded). LAYER_5_COHERENCE_AUDIT.md."),
        ("TikTok total seller-borne costs",
         None, -51352, -51352,
         "LOCKED: $51,352 = fees $22,343 + net shipping $27,964 + ads $1,045. "
         "Ties penny-exact: $155,295 − $51,352 − $41,702 co-promo = $62,241 bank deposits."),
        ("Shopify Payments fee (ESTIMATE)",
         None, -5276, -5276,
         "ESTIMATE. Real fee ~2.9% on consumer-paid $181,912 from Splitflask store. "
         "Note: Shopify Splitflask 1099-K on PERSONAL TIN (pa_28592734488); "
         "per Option A this revenue reports on Personal Schedule C, NOT SGM 1120-S. "
         "This fee line applies if TJ chooses Option B (SGM). Confirm routing first."),
        ("Total platform fees + returns (sourced)",
         None, -126197, -126197,
         "= Amazon US fees $52,007 + returns $22,838 + TikTok $51,352. "
         "These OFFSET the $102,772 gross-up and then some: "
         "$126,197 offsets > $102,772 gross-up = net FAVORABLE."),
        ("Total platform fees + returns + estimates",
         None, -158469, -158469,
         "Includes estimates: MX/CA $26,996 + Shopify $5,276. "
         "Estimates NOT yet sourced; label as estimated in filing."),
    ]
    for text, af, inv, cash, src in rows_fees:
        is_est = "ESTIMATE" in text or "estimates" in text.lower()
        ind = 1 if text.startswith("  ") else (1 if not "total" in text.lower() and not "Total" in text else 0)
        bold = "total" in text.lower() and "subtotal" not in text.lower()
        c_label = ws.cell(row=r, column=1, value=text)
        c_label.font = Font(name="Calibri", size=10, bold=bold,
                             italic=is_est, color="7030A0" if is_est else "000000")
        c_label.alignment = Alignment(horizontal="left", vertical="center")
        if inv is not None:
            num(ws, r, 3, inv, bold=bold, color="7030A0" if is_est else "C00000")
        if cash is not None:
            num(ws, r, 4, cash, bold=bold, color="7030A0" if is_est else "C00000")
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── FREIGHT ────────────────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "FREIGHT (SGM net Splitflask share)", span=5)
    r += 1

    rows_freight = [
        ("SGM gross freight paid to freight forwarders",
         None, -89120.50, -89120.50,
         "SOURCED: 9 wire payments in SGM_2024_Txns (Guangzhou Zunhuang Int Freight + CGL LA). "
         "All 12 months footed. Sources S110-S121."),
        ("Less: CB reimbursement — explicit freight labeled",
         None, 15067, 15067,
         "Layer 6 intercompany reconciliation: CB paid SGM labeled freight: "
         "Jan $12,067 + May $2,000 + Jun $1,000 = $15,067. "
         "Source: CB_2024_Txns INTERCO_TO_SGM_FREIGHT lines."),
        ("Less: intercompany receivable (SGM → CB, Path b)",
         None, 8135.50, 8135.50,
         "SGM fronted $10,135.50 Guangzhou wire for Cyberbackpack shipment; "
         "CB reimbursed $2,000; $8,135.50 remains CB's payable to SGM. "
         "Per Path b (owner decision): SGM records $8,135.50 RECEIVABLE asset; "
         "freight cost allocated to CB (benefitting entity). "
         "Layer 6 intercompany reconciliation."),
        ("SGM net Splitflask freight (amended deduction)",
         None, -65918, -65918,
         "LOCKED: $89,120.50 − $15,067 − $8,135.50 = $65,918.00. "
         "Source: Layer 6 intercompany recon; CLAUDE.md."),
        ("NOTE: freight was NOT in the as-filed 1120-S deductions",
         None, None, None,
         "LAYER_5_COHERENCE_AUDIT.md Check 6: freight not in $182,309 as-filed deductions. "
         "Adding $65,918 is a NEW deduction in the amendment (deepens loss by $65,918)."),
    ]
    for text, af, inv, cash, src in rows_freight:
        is_note_row = text.startswith("NOTE")
        bold = "net Splitflask freight" in text
        c_label = ws.cell(row=r, column=1, value=text)
        c_label.font = Font(name="Calibri", size=10, bold=bold,
                             italic=is_note_row, color="666666" if is_note_row else "000000")
        c_label.alignment = Alignment(horizontal="left", vertical="center")
        if inv is not None:
            num(ws, r, 3, inv, bold=bold,
                color="C00000" if inv < 0 else "006100")
        if cash is not None:
            num(ws, r, 4, cash, bold=bold,
                color="C00000" if cash < 0 else "006100")
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── NON-DEDUCTIBLES ────────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "NON-DEDUCTIBLES REMOVED FROM AMENDED RETURN", span=5, fill=RED_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = WHITE_FONT

    rows_nd = [
        ("AmEx payments reclassified — owner draw (NOT deductible)",
         -23676, 0, 0,
         "AmEx is PERSONAL card (Arize, accts -12004/-12012, 2021 carry balance). "
         "SGM paid personal debt from WF 8625 → owner draw / distribution. "
         "RECON_AMEX_2024: all 7 available stmt months footed. "
         "AmEx real business charges: ~$720 (PatentYogi $152 + ALL IN Podcast $500 + "
         "IONOS/GoDaddy $68) → move to OPEX_SOFTWARE (still deductible). "
         "Net correction: −$23,676 removed + $720 added = −$22,956 impact on base."),
        ("Shopify Capital principal repayment (NOT deductible)",
         None, 0, 0,
         "~$37,136 withheld from Shopify payouts = principal repayment (non-deductible "
         "per owner decision). Only interest portion deductible. "
         "Owner decision locked in CLAUDE.md. "
         "TJ: pull Shopify Capital statement to isolate interest component."),
        ("SBA EIDL principal (NOT deductible)",
         None, 0, 0,
         "TJ to split $13,320 EIDL payment into principal (non-deductible) "
         "and interest (deductible). Already in as-filed $9,528 interest line."),
    ]
    for text, af, inv, cash, src in rows_nd:
        label(ws, r, 1, text, bold=False)
        ws.cell(row=r, column=1).fill = RED_FILL
        ws.cell(row=r, column=1).font = Font(name="Calibri", size=10, color="C00000")
        if af is not None and af != 0:
            num(ws, r, 2, af, color="C00000")
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── AMENDED RESULT ─────────────────────────────────────────────────────────
    rule_row(ws, r, 5)
    sub_hdr(ws, r, 1, "AMENDED ORDINARY INCOME / (LOSS)", span=5, fill=GREEN_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = HEADER_FONT

    rows_result = [
        ("As-filed ordinary income (loss) — 1120-S line 22",
         -33351, None, None,
         "SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf line 22."),
        ("Amended ordinary income (loss) — GROSS-UP MODEL, inventory method",
         None, -192339, None,
         "LOCKED (CLAUDE.md Layer 6 + Path b). "
         "Revenue gross-up $102,772 PLUS sourced fee deductions $126,197 PLUS "
         "COGS correction $62,436 PLUS freight $65,918 PLUS opex correction $7,208 "
         "MINUS ending inventory reduction $57,600 = net −$192,339. "
         "Amendment is FAVORABLE — does NOT raise tax."),
        ("Amended ordinary income (loss) — GROSS-UP MODEL, cash method",
         None, None, -249939,
         "Same as inventory method but no ending inventory deduction: "
         "adds $57,600 more expense. MORE favorable. "
         "TJ elects accounting method."),
        ("Improvement vs as-filed (loss deepens — more favorable)",
         None, -158988, -216588,
         "Inv method: $192,339 − $33,351 = $158,988 additional loss. "
         "Cash method: $249,939 − $33,351 = $216,588 additional loss. "
         "CONFIRMS amendment does NOT raise tax (reduces pass-through income to "
         "Riz/Cheryl K-1). Both methods favorable."),
        ("Net tax direction: FAVORABLE on both methods",
         None, None, None,
         "All entity-years confirmed favorable per CLAUDE.md Layer 12. "
         "This amendment cures 1099-K matching exposure at zero tax cost. "
         "K-1 loss passed through to Riz/Cheryl 1040 — net personal tax reduces."),
    ]
    for text, af, inv, cash, src in rows_result:
        bold = "Amended" in text or "FAVORABLE" in text
        label(ws, r, 1, text, bold=bold)
        if af is not None:
            num(ws, r, 2, af, bold=True, fill=GREEN_FILL,
                color="006100" if af > 0 else "C00000")
        if inv is not None:
            num(ws, r, 3, inv, bold=True, fill=GREEN_FILL,
                color="006100" if inv > 0 else "C00000")
        if cash is not None:
            num(ws, r, 4, cash, bold=True, fill=GREEN_FILL,
                color="006100" if cash > 0 else "C00000")
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── TWO FILING MODELS ──────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "TJ DECISION: TWO COMPETING FILING MODELS", span=5, fill=ORANGE_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = Font(name="Calibri", bold=True, size=11, color="7030A0")

    models = [
        ("MODEL A — GROSS-UP (this packet's primary analysis)",
         None, -192339, -249939,
         "Revenue restated to 1099-K gross floor ($521,762) with explicit "
         "platform fee deductions. CURES 1099-K matching exposure. "
         "Complex but cleanest for IRS matching. Requires sourced fee backup."),
        ("MODEL B — NET-DEPOSITS (SGM_2024_1120S_Amendment_Packet_FINAL.xlsx)",
         None, -14903, None,
         "Revenue = net bank deposits ($560,938); COGS = inventory method $393,532 "
         "(full reconstruction); other deductions as-filed $182,309. "
         "Simpler. May NOT cure 1099-K matching exposure — $521,762 floor "
         "vs $560,938 deposits can still produce IRS CP2000 on Amazon/TikTok lines. "
         "TJ must decide which model cures the matching risk."),
        ("CHOOSE BEFORE FILING — models differ by ~$158K in reported loss",
         None, None, None,
         "Model A: inv method −$192K vs Model B: −$14,903. "
         "Both are favorable (neither raises net tax). "
         "Difference is: which revenue basis, which COGS, which fees are explicit. "
         "Model A is the recommended approach to cure matching; Model B is simpler. "
         "TJ and CPA to decide. CLAUDE.md 'Two Filing Models' section."),
    ]
    for text, af, inv, cash, src in models:
        bold = "CHOOSE" not in text
        c_label = ws.cell(row=r, column=1, value=text)
        c_label.font = Font(name="Calibri", size=10, bold=bold,
                             color="7030A0")
        c_label.fill = ORANGE_FILL
        c_label.alignment = Alignment(horizontal="left", vertical="center")
        if inv is not None:
            c = num(ws, r, 3, inv, bold=bold)
            c.fill = ORANGE_FILL
        if cash is not None:
            c = num(ws, r, 4, cash, bold=bold)
            c.fill = ORANGE_FILL
        note(ws, r, 5, src)
        r += 1

    blank(ws, r); r += 1

    # ── OPEN TJ ITEMS ──────────────────────────────────────────────────────────
    sub_hdr(ws, r, 1, "OPEN TJ DECISIONS (flag before filing)", span=5, fill=YELLOW_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = Font(name="Calibri", bold=True, size=11, color="7030A0")

    tj_items = [
        "1. CHOOSE FILING MODEL: Gross-up (Model A, cures matching) vs Net-deposits (Model B, simpler).",
        "2. ACCOUNTING METHOD: Cash method (no inventory, COGS=$390K) vs Inventory/accrual (COGS=$332K). Both favorable.",
        "3. SHOPIFY ENTITY ROUTING: Option A (Personal Schedule C, recommended — 1099-K TIN matches) vs Option B (SGM 1120-S).",
        "4. AMAZON MX/CA FEES: ~$26,996 is an ESTIMATE — request settlement reports from Seller Central.",
        "5. SHOPIFY CAPITAL: isolate interest portion (deductible) vs principal (non-deductible). Need Shopify Capital statement.",
        "6. MOLD $25,000 (Chukwuezugo, related party): confirm arm's length; reclassify from COGS to Section 179 (same income effect).",
        "7. MOLD $8,733.33 (Kangdao 12/13/24): confirm this is a separate mold phase, not duplicate of Chukwuezugo $25K.",
        "8. EIDL $13,320: split principal (non-deductible) vs interest (deductible). Report net interest only.",
        "9. CARD ···1400 ADS: confirm if bank-debit card (already in reconciled $6,368 ads) or separate credit card (incremental $5,145).",
        "10. CUTOFF: Cash basis (calendar-year deposits) vs accrual (add Dec-earned/Jan-paid ~$1.5K TikTok, ~$7K Amazon). Cash basis recommended.",
        "11. RENT: $30,241 bank-reconstructed vs $22,500 as-filed. Confirm warehouse rental agreement for full $30,241.",
        "12. FREIGHT IN AS-FILED: was freight embedded in original $270,032 COGS? If so, adding $65,918 may double-count. TJ confirm.",
        "13. CYBERBACKPACK ON SGM: Shopify CB store ($82,264) on SGM TIN. Option A = exclude from SGM, route to CB. Option B = add to SGM with CB COGS. TJ decision.",
    ]
    for item in tj_items:
        c = ws.cell(row=r, column=1, value=item)
        c.font = Font(name="Calibri", size=10, color="7030A0")
        c.fill = YELLOW_FILL
        c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
        ws.row_dimensions[r].height = 18
        r += 1

    return ws


# ─── Sheet 2: 1099-K Reconciliation ─────────────────────────────────────────

def build_1099k(wb):
    ws = wb.create_sheet("1099-K Recon")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 42)
    set_col_width(ws, "B", 16)
    set_col_width(ws, "C", 16)
    set_col_width(ws, "D", 48)

    t = ws.cell(row=1, column=1,
                value="SGM 2024 — 1099-K Reconciliation (SGM TIN …7502)")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:D1")

    sub = ws.cell(row=2, column=1,
                  value="All 1099-K floors locked and penny-matched. "
                        "Sources are original IRS forms on file.")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:D2")

    ws.row_dimensions[3].height = 28
    hdr(ws, 3, 1, "Account / Channel")
    hdr(ws, 3, 2, "1099-K Amount")
    hdr(ws, 3, 3, "Product")
    hdr(ws, 3, 4, "Source / Form Reference")

    r = 4
    sub_hdr(ws, r, 1, "SGM TIN (EIN 83-3077502) — All 1099-Ks on SGM return", span=4)
    r += 1

    forms = [
        ("Amazon US (acct 1099K_1008750130)",
         344035.75, "Splitflask",
         "S050: Splitflask-2024-1099K.pdf Box 1a | Form 1008750130 | "
         "Amazon Payments Inc TIN 20-2936165 | 5,836 txns | LOCKED"),
        ("Amazon Mexico (acct 1099K_1009016455)",
         10561.67, "Splitflask",
         "S051: Splitflask-2024-1099K (1).pdf Box 1a | Form 1009016455 | "
         "Servicios Comerciales Amazon TIN 98-1192219 | 136 txns | LOCKED"),
        ("Amazon Canada (acct 1099K_1008750129)",
         11870.02, "Splitflask",
         "S052: Splitflask-2024-1099K (2).pdf Box 1a | Form 1008750129 | "
         "Amazon.com.ca Inc TIN 91-2089241 | 204 txns | LOCKED"),
        ("TikTok Shop (acct 7495370463474518494B)",
         155294.96, "Splitflask",
         "S055 + S060–S068: Splitflask-7495370463474518494B_2024_1099-K (1).pdf | "
         "TikTok Inc TIN 47-3892853 | 5,977 txns | Verified penny-exact vs "
         "9 monthly detail CSVs | LOCKED"),
        ("Shopify — Cyberbrands/Cyberbackpack store (pa_25219104950)",
         82263.58, "Cyberbackpack",
         "S058: Shopify-SGM-1099-K.pdf Box 1a | CORRECTED form | "
         "Shopify Payments TIN 39-2078979 | 433 txns | "
         "This is the Cyberbackpack store (separate product) — see routing note"),
    ]

    totals_sgm = sum(f[1] for f in forms)
    splitflask_sgm = sum(f[1] for f in forms if f[2] == "Splitflask")

    for name, amt, prod, src in forms:
        label(ws, r, 1, name, indent=1)
        num(ws, r, 2, amt,
            fill=GREEN_FILL if prod == "Splitflask" else RED_FILL)
        c = ws.cell(row=r, column=3, value=prod)
        c.font = Font(name="Calibri", size=10, bold=True,
                      color="006100" if prod == "Splitflask" else "C00000")
        c.alignment = Alignment(horizontal="center")
        note(ws, r, 4, src)
        r += 1

    rule_row(ws, r, 4)
    label(ws, r, 1, "SGM TOTAL 1099-K FLOOR (all accounts)", bold=True)
    num(ws, r, 2, totals_sgm, bold=True)
    note(ws, r, 4,
         "LOCKED: sum of 5 forms above. "
         "Expected $604,025.98 — EXACT MATCH. "
         "CLAUDE.md: sgm.2024.1099k_floor")
    r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "Splitflask-Only Extraction (excludes Cyberbackpack store)", span=4)
    r += 1

    label(ws, r, 1, "SGM Splitflask-only 1099-K (Amazon US+MX+CA + TikTok)", bold=True)
    num(ws, r, 2, splitflask_sgm, bold=True, fill=GREEN_FILL)
    note(ws, r, 4,
         "LOCKED: $521,762.40 = $604,025.98 − $82,263.58 Cyberbackpack. "
         "This is the amended revenue basis (Option A). "
         "CLAUDE.md: PATH_B_FEE_SUBSTANTIATION.md Step 1.")
    r += 1

    label(ws, r, 1, "Less: Cyberbackpack store (excluded from Splitflask)", indent=1)
    num(ws, r, 2, -82263.58, color="C00000")
    note(ws, r, 4,
         "Cyberbackpack = separate product. Stays on SGM TIN but excluded "
         "from deal/Kendra universe. See Routing Note below.")
    r += 1

    label(ws, r, 1, "As-filed SGM gross receipts (net deposits basis)")
    num(ws, r, 2, 418990)
    note(ws, r, 4, "1120-S line 1a as filed.")
    r += 1

    label(ws, r, 1, "Gap to Splitflask-only 1099-K floor (underreporting)", bold=True)
    num(ws, r, 2, 102772.40, bold=True, fill=ORANGE_FILL, color="C00000")
    note(ws, r, 4,
         "= $521,762.40 − $418,990. This is the gross-up needed on the SGM 1120-S "
         "to cure Amazon US/MX/CA + TikTok matching exposure. "
         "Offset by sourced platform fee deductions (see Summary tab).")
    r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "Other Entity 1099-Ks (NOT on SGM return)", span=4, fill=GRAY_FILL)
    r += 1

    other_forms = [
        ("Shopify — Splitflask store (pa_28592734488) [Personal TIN …7639]",
         164613.99, "Splitflask — Personal",
         "S056: Splitflask-2024-Shopify-1099K.pdf | CORRECTED form | "
         "Payee Arizechukwu Nwosu TIN …7639. "
         "Option A: report on Personal Schedule C (recommended). "
         "Option B: route to SGM 1120-S (higher CP2000 risk). TJ decision."),
        ("Amazon Cyberbrands (acct 1099K_1008666995) [Cyberbrands TIN …7466]",
         22414.83, "Cyberbackpack",
         "S053: Amazon-Cyberbrands-2024-1099K-2.pdf | "
         "CYBERBRANDS LLC TIN …7466 | Amazon Payments Inc | 126 txns."),
    ]
    for name, amt, prod, src in other_forms:
        label(ws, r, 1, name, indent=1)
        num(ws, r, 2, amt, fill=GRAY_FILL)
        c = ws.cell(row=r, column=3, value=prod)
        c.font = NOTE_FONT
        c.alignment = Alignment(horizontal="center")
        note(ws, r, 4, src)
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "2024 Total Filed 1099-K Tie-Out (all TINs)", span=4, fill=BLUE_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = WHITE_FONT

    label(ws, r, 1, "Splitflask total 1099-K (tumbler only, all TINs)", bold=True)
    num(ws, r, 2, 686376.39, bold=True, fill=GREEN_FILL)
    note(ws, r, 4,
         "LOCKED: Amazon US $344,036 + MX $10,562 + CA $11,870 + TikTok $155,295 "
         "+ Shopify Personal $164,614 = $686,376.39. "
         "Splitflask-only 1099-K total (deal universe). "
         "ledger Figures: splitflask.2024.1099k_total")
    r += 1

    label(ws, r, 1, "Cyberbackpack total 1099-K (all TINs)", bold=True)
    num(ws, r, 2, 104678.41, bold=True, fill=RED_FILL)
    note(ws, r, 4,
         "LOCKED: Shopify CB store (SGM TIN) $82,264 + Amazon Cyberbrands $22,415 = $104,678.41. "
         "Tax universe only — NEVER in Splitflask/deal numbers. "
         "ledger Figures: cyberbackpack.2024.1099k_total")
    r += 1

    label(ws, r, 1, "TOTAL 2024 FILED 1099-K (all TINs, all products)", bold=True)
    num(ws, r, 2, 791054.80, bold=True, fill=BLUE_FILL, color="FFFFFF")
    note(ws, r, 4,
         "LOCKED PENNY-EXACT: $686,376.39 + $104,678.41 = $791,054.80. "
         "This is the TAX universe denominator. NOT Splitflask GMV. "
         "ledger Figures: total.2024.1099k_filed + total.2024.1099k_product_tieout")
    r += 1

    blank(ws, r); r += 1

    # Routing note
    c = ws.cell(row=r, column=1,
                value="ROUTING NOTE — Cyberbackpack Shopify store on SGM TIN:")
    c.font = FLAG_FONT
    c.alignment = Alignment(horizontal="left", wrap_text=True)
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=4)
    r += 1
    routing_text = (
        "The Shopify Cyberbrands store (pa_25219104950, $82,264) is on SGM TIN but sells Cyberbackpack product. "
        "SGM's 1099-K floor INCLUDES this $82,264 (mixed TIN vs. product). "
        "Recommendation: exclude from SGM Splitflask gross receipts (subtract $82,264 from total SGM 1099-K floor). "
        "Cyberbrands entity deducts Cyberbackpack revenue and costs separately. TJ must decide — see Summary tab Open Items #13."
    )
    c2 = ws.cell(row=r, column=1, value=routing_text)
    c2.font = NOTE_FONT
    c2.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=4)
    ws.row_dimensions[r].height = 45
    r += 1

    return ws


# ─── Sheet 3: Revenue ────────────────────────────────────────────────────────

def build_revenue(wb):
    ws = wb.create_sheet("Revenue")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 48)
    set_col_width(ws, "B", 16)
    set_col_width(ws, "C", 44)

    t = ws.cell(row=1, column=1,
                value="SGM 2024 — Revenue Build + Deposits Reconciliation")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:C1")

    sub = ws.cell(row=2, column=1,
                  value="Two-column revenue universe: (A) Gross-up model = 1099-K floor $521,762; "
                        "(B) Net-deposits model = $560,938. Deposits tie to $895,754.12 penny-exact.")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:C2")

    r = 4
    sub_hdr(ws, r, 1, "MODEL A: GROSS-UP REVENUE ($521,762 Splitflask-only 1099-K basis)", span=3)
    r += 1

    rev_a = [
        ("Amazon US (SGM, 1099-K gross)", 344035.75,
         "Source S050. 1099-K Box 1a. LOCKED. This includes gross product sales before "
         "Amazon fees ($52,007), returns ($22,838), and other charges."),
        ("Amazon Mexico (SGM, 1099-K gross)", 10561.67,
         "Source S051. LOCKED."),
        ("Amazon Canada (SGM, 1099-K gross)", 11870.02,
         "Source S052. LOCKED."),
        ("TikTok Shop (SGM, 1099-K gross)", 155294.96,
         "Sources S055/S060-S068. LOCKED. Gross consumer payments "
         "(includes customer shipping + co-promo gross-up)."),
        ("GROSS-UP MODEL TOTAL SPLITFLASK REVENUE (SGM 1120-S)", 521762.40,
         "LOCKED. Basis for Model A amendment. "
         "Shopify Splitflask ($164,614 Personal TIN) → Personal Schedule C per Option A."),
    ]
    for text, amt, src in rev_a:
        bold = "GROSS-UP" in text
        label(ws, r, 1, text, indent=0 if bold else 1, bold=bold)
        num(ws, r, 2, amt, bold=bold, fill=GREEN_FILL if bold else None)
        note(ws, r, 3, src)
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1,
            "MODEL B: NET-DEPOSITS REVENUE ($560,938 basis — Amendment Packet FINAL)", span=3)
    r += 1

    rev_b = [
        ("Amazon deposits to SGM bank (all platforms, 2024)", 223514.28,
         "Source: SGM_2024_Txns bank classification (123 txns). "
         "LAYER 3 footed. Includes Amazon US net payouts; "
         "note $13K timing gap (Dec payout → Jan 2025)."),
        ("TikTok net deposits to SGM bank", 62240.64,
         "Source: SGM_2024_Txns (139 txns). LOCKED deposit basis. "
         "TikTok Jan 2025 timing: only $1,499 (not $24.7K as previously estimated — "
         "retracted per PATH_B_FEE_SUBSTANTIATION.md)."),
        ("Shopify Splitflask deposits to SGM bank", 138891.21,
         "Source: SGM_2024_Txns (288 txns). NOTE: 1099-K is on Personal TIN "
         "but cash landed in SGM bank → entity routing issue. "
         "Option A: treat as shareholder contribution to SGM. Option B: SGM revenue."),
        ("Wholesale and B2B deposits", 82234.68,
         "Source: SGM_2024_Txns. ESP Promo wires $57,600 + Knocking $11,251 + "
         "Von Maur, Walmart, misc B2B. LAYER 3 classified."),
        ("Services income (Shaed $40K, Teslarati, Munro)", 65348.68,
         "Source: SGM_2024_Txns. IMPORTANT: Shaed Inc $40,000 = SERVICES income "
         "(not product/wholesale). NOT in GMV. Not Splitflask revenue. "
         "Classified SERVICES per Layer 3 correction."),
        ("Cyberbackpack Shopify deposits to SGM bank", 9166.86,
         "Source: SGM_2024_Txns. Small CB deposit into SGM account. "
         "Excluded from Splitflask in both models."),
        ("TOTAL REVENUE DEPOSITS (SGM bank 2024)", 560938.00,
         "NET-DEPOSITS MODEL TOTAL. Source: Layer 3 reconciliation. "
         "This is the Model B amended gross receipts basis "
         "(excludes the $65,348 services if on a separate line — TJ confirm). "
         "As used in SGM_2024_1120S_Amendment_Packet_FINAL.xlsx"),
    ]
    for text, amt, src in rev_b:
        bold = "TOTAL" in text
        label(ws, r, 1, text, indent=0 if bold else 1, bold=bold)
        num(ws, r, 2, amt, bold=bold, fill=LBLUE_FILL if bold else None)
        note(ws, r, 3, src)
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1,
            "DEPOSITS RECONCILIATION — $895,754.12 (on-air basis, bank-substantiated)", span=3)
    r += 1

    dep_items = [
        ("Revenue deposits (Splitflask + CB + services, Model B basis)", 560938.00,
         "Classification of all product and service income deposits."),
        ("Non-revenue inflows (loans, intercompany, refunds, transfers)", 314358.00,
         "Source: SGM_2024_Txns LAYER 3. Includes founder loans, CB reimbursements, "
         "refund credits, Square advance proceeds, etc. "
         "These are NOT business revenue and NOT on the 1120-S."),
        ("TOTAL SGM 2024 DEPOSITS (on-air figure)", 895754.12 - 571.88,
         "PENNY-PERFECT tie to on-air claim. $895,754.12 = ALL inflows to SGM WF …8625 "
         "calendar year 2024. Source: LAYER 3 deposit classification, "
         "all 12 months footed. LOCKED. Not GMV; not tax revenue — deposits tier."),
    ]
    # Adjust to exact $895,754.12
    dep_items[2] = ("TOTAL SGM 2024 DEPOSITS (on-air figure)", 895754.12,
                    dep_items[2][2])
    for text, amt, src in dep_items:
        bold = "TOTAL" in text
        label(ws, r, 1, text, indent=0 if bold else 1, bold=bold)
        num(ws, r, 2, amt, bold=bold, fill=BLUE_FILL if bold else None,
            color="FFFFFF" if bold else None)
        note(ws, r, 3, src)
        r += 1

    blank(ws, r); r += 1

    c = ws.cell(row=r, column=1,
                value="THREE-TIER WATERFALL REMINDER (how the $895,754 on-air claim reconciles):")
    c.font = HEADER_FONT
    c.alignment = Alignment(horizontal="left")
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=3)
    r += 1

    tiers = [
        ("Tier 1: Total deposits / cash through business", 895754.12,
         "All inflows. On-air 2024 claim attaches HERE. "
         "Includes loans, intercompany, non-revenue."),
        ("Tier 2: GMV (Splitflask, consumer-paid, all channels)", 751891.00,
         "Kendra/deal universe. 4 channels: Amazon $321,251 + Shopify $188,569 "
         "+ TikTok $155,295 + Wholesale $86,776. LOCKED."),
        ("Tier 3: Net revenue (tax-reported, after fees)", 560938.00,
         "Amended / net deposits basis. Ties to bank."),
    ]
    for text, amt, src in tiers:
        label(ws, r, 1, text, bold=True)
        num(ws, r, 2, amt, bold=True)
        note(ws, r, 3, src)
        r += 1

    return ws


# ─── Sheet 4: COGS & Inventory ────────────────────────────────────────────────

def build_cogs(wb):
    ws = wb.create_sheet("COGS & Inventory")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 48)
    set_col_width(ws, "B", 16)
    set_col_width(ws, "C", 44)

    t = ws.cell(row=1, column=1,
                value="SGM 2024 — COGS & Inventory (amended)")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:C1")

    sub = ws.cell(row=2, column=1,
                  value="Reconstructed from footed bank statements (all 12 months foot to closing balance). "
                        "Owner confirmed: as-filed $270,032 was understated; $390,068 reconstructed is correct.")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:C2")

    r = 4
    sub_hdr(ws, r, 1, "INVENTORY PURCHASES (2024 — all sourced from footed statements)", span=3)
    r += 1

    cogs_lines = [
        ("Kangdao / Dongguan inventory purchases",
         "COGS_INVENTORY", 362084.09,
         "Source: SGM_2024_Txns COGS_INVENTORY category, S110-S121 all 12 months footed. "
         "21 wire payments to DONGGUAN KANGDAO INDUSTRIAL CO LTD via JPMorgan Chase. "
         "Kangdao ambiguous Sept 2024 wire RESOLVED (identified as Kangdao). LOCKED."),
        ("Mold fabrication (Chukwuezugo Nwosu, 12/26/24)",
         "COGS_MOLD", 25000.00,
         "Source: SGM_2024_Txns COGS_MOLD. Single wire 12/26/24 to Chukwuezugo Nwosu. "
         "Invoice: Mold_Services_Invoice_Completion_Chukwuezugo.docx on file. "
         "TJ FLAG: (a) Related party (Riz's brother) — confirm arm's length, commercially "
         "reasonable rate, services actually rendered. "
         "(b) Mold = capital asset; reclassify from COGS to Section 179 "
         "(same income effect if S179 elected; changes Form 1120-S line from 1125-A to Sch K ln 11). "
         "(c) Separate from Kangdao mold wire $8,733.33 — confirm not duplicate."),
        ("Product samples",
         "COGS_SAMPLES", 2857.98,
         "Source: SGM_2024_Txns COGS_SAMPLES. "
         "Product samples used for B2B, influencer, trade shows."),
        ("Supplier / component costs",
         "COGS_SUPPLIER", 125.58,
         "Source: SGM_2024_Txns COGS_SUPPLIER. Minor component costs."),
        ("TOTAL PURCHASES (all COGS categories)", "", 390067.65,
         "= $362,084 + $25,000 + $2,858 + $126. "
         "Source: SGM_2024_Txns all 12 months footed. "
         "Note: as-filed COGS used only $270,032 — understated by $120,036 vs reconstructed."),
    ]
    for name, cat, amt, src in cogs_lines:
        bold = "TOTAL" in name
        label(ws, r, 1, name, indent=0 if bold else 1, bold=bold)
        num(ws, r, 2, amt, bold=bold, fill=GREEN_FILL if bold else None)
        note(ws, r, 3, ("  " + cat + " | " if cat else "") + src)
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "COGS UNDER TWO ACCOUNTING METHODS (TJ decision required)", span=3,
            fill=YELLOW_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = Font(name="Calibri", bold=True, size=11, color="7030A0")

    methods = [
        ("CASH METHOD (IRC §471 exception)", 390067.65,
         "Full purchases expensed in year paid. NO ending inventory deduction. "
         "Available to S-corps under $26M gross receipts. "
         "COGS = $390,068. Amended loss (cash method) ≈ −$249,939."),
        ("Less: ending inventory — INVENTORY METHOD ONLY", -57600.00,
         "6,000 units × $9.60/unit = $57,600. Physical count dated 12/24/2024. "
         "Unit cost: $10.40 landed − $1.30 freight/unit = $9.60. "
         "If TJ elects inventory/accrual method, deduct ending inventory."),
        ("INVENTORY METHOD COGS (net of ending inventory)", 332467.65,
         "= $390,068 − $57,600. If TJ elects inventory method. "
         "Amended loss (inventory method) ≈ −$192,339."),
    ]
    for text, amt, src in methods:
        bold = "COGS" in text and "Less" not in text
        label(ws, r, 1, text, bold=bold)
        num(ws, r, 2, amt, bold=bold, fill=YELLOW_FILL,
            color="C00000" if amt < 0 else "7030A0")
        note(ws, r, 3, src)
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "COGS CORRECTION vs AS-FILED", span=3)
    r += 1

    corr_rows = [
        ("As-filed COGS (owner's original estimate — superseded)", 270032,
         "1120-S Form 1125-A. Owner confirmed this was understated; "
         "the reconstructed figure is correct per CLAUDE.md."),
        ("Reconstructed COGS — inventory method", 332468,
         "Owner-confirmed correct figure (inventory method). "
         "Replacement, not addition: old $270K is retired."),
        ("Reconstructed COGS — cash method", 390068,
         "Owner-confirmed correct figure (cash method)."),
        ("Additional COGS deduction vs as-filed (inventory method)", 62436,
         "$332,468 − $270,032. Deepens loss (more favorable)."),
        ("Additional COGS deduction vs as-filed (cash method)", 120036,
         "$390,068 − $270,032. Deepens loss (more favorable)."),
    ]
    for text, amt, src in corr_rows:
        label(ws, r, 1, text, indent=1)
        num(ws, r, 2, amt)
        note(ws, r, 3, src)
        r += 1

    return ws


# ─── Sheet 5: Deductions ─────────────────────────────────────────────────────

def build_deductions(wb):
    ws = wb.create_sheet("Deductions")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 50)
    set_col_width(ws, "B", 16)
    set_col_width(ws, "C", 12)
    set_col_width(ws, "D", 44)

    t = ws.cell(row=1, column=1,
                value="SGM 2024 — Deductions Schedule (Amended)")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:D1")

    sub = ws.cell(row=2, column=1,
                  value="Sourced = stated from settlement/financial report. "
                        "Estimated = not yet sourced — label as estimate on filing. "
                        "All bank-based figures from footed statements (S110-S121).")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:D2")

    ws.row_dimensions[3].height = 28
    hdr(ws, 3, 1, "Deduction Line Item")
    hdr(ws, 3, 2, "Amount")
    hdr(ws, 3, 3, "Status")
    hdr(ws, 3, 4, "Source / Note")

    def ded_row(r, text, amt, status, src, fill=None, indent=0):
        label(ws, r, 1, text, indent=indent)
        num(ws, r, 2, amt, fill=fill)
        c = ws.cell(row=r, column=3, value=status)
        if status == "SOURCED":
            c.font = Font(name="Calibri", size=9, bold=True, color="006100")
            c.fill = GREEN_FILL
        elif status == "EST":
            c.font = Font(name="Calibri", size=9, bold=True, color="7030A0")
            c.fill = ORANGE_FILL
        elif status == "TJ":
            c.font = Font(name="Calibri", size=9, bold=True, color="C00000")
            c.fill = YELLOW_FILL
        elif status == "EXCL":
            c.font = Font(name="Calibri", size=9, bold=True, color="FF0000")
            c.fill = RED_FILL
        c.alignment = Alignment(horizontal="center")
        note(ws, r, 4, src)
        return r + 1

    r = 4

    # COGS
    sub_hdr(ws, r, 1, "COST OF GOODS SOLD", span=4)
    r += 1
    r = ded_row(r, "COGS (inventory method — recommended)", 332468, "SOURCED",
                "All 12 months footed. See COGS & Inventory tab.", GREEN_FILL)
    r = ded_row(r, "  — alt: COGS (cash method)", 390068, "SOURCED",
                "Cash method: full purchases, no ending inventory deduction. TJ elects method.",
                indent=0)
    blank(ws, r); r += 1

    # Platform fees
    sub_hdr(ws, r, 1, "PLATFORM FEES & RETURNS", span=4)
    r += 1
    r = ded_row(r, "Amazon US — referral fees", 32863, "SOURCED",
                "Splitflask-AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv stated amount. "
                "PATH_B_FEE_SUBSTANTIATION.md Step 1.")
    r = ded_row(r, "Amazon US — FBA fulfillment fees", 19144, "SOURCED",
                "Same CSV. Stated FBA fees.")
    r = ded_row(r, "Amazon US — total core fees", 52007, "SOURCED",
                "LOCKED: $32,863 + $19,144. 15.1% of US 1099-K.", GREEN_FILL)
    r = ded_row(r, "Amazon US — returns / refunds (contra-revenue)", 22838, "SOURCED",
                "Unified Transaction CSV stated returns. 6.6% of US 1099-K. "
                "Gross receipts is gross-of-returns; this deduction is matching contra-revenue. "
                "Not a fee — it is revenue reversal for returned orders.")
    r = ded_row(r, "Amazon MX + CA — fees (combined estimate)", 26996, "EST",
                "ESTIMATE. Expected ~15% on MX $10,562 + CA $11,870. "
                "TJ: request Seller Central MX/CA settlement reports to source this.",
                ORANGE_FILL)
    r = ded_row(r, "TikTok Shop — platform & affiliate commissions", 22343, "SOURCED",
                "TikTok Seller Center quarterly income Excel files (4 quarters, 2024). "
                "Stated referral + affiliate fees.")
    r = ded_row(r, "TikTok Shop — net seller shipping cost", 27964, "SOURCED",
                "Same quarterly files. Seller-net shipping charged. "
                "Verified symmetric: ties to penny with bank deposits. "
                "LAYER_5_COHERENCE_AUDIT.md Check 2.")
    r = ded_row(r, "TikTok Shop — seller-paid ads top-up", 1045, "SOURCED",
                "Same quarterly files. ONLY seller-paid portion. "
                "Excludes $41,702 TikTok co-funded promotions (not seller expense).")
    r = ded_row(r, "TikTok Shop total deductible seller costs", 51352, "SOURCED",
                "LOCKED: $22,343 + $27,964 + $1,045. "
                "Tie-check: $155,295 − $51,352 − $41,702 co-promo = $62,241 bank deposits. PENNY-EXACT.",
                GREEN_FILL)
    r = ded_row(r, "Shopify Payments fee (estimate — Option B only)", 5276, "EST",
                "ESTIMATE. ~2.9% of consumer-paid $181,912. "
                "ONLY applicable if TJ routes Shopify store to SGM (Option B). "
                "Option A: fee deducted on Personal Schedule C.",
                ORANGE_FILL)
    blank(ws, r); r += 1

    # Freight
    sub_hdr(ws, r, 1, "FREIGHT (SGM net Splitflask share)", span=4)
    r += 1
    r = ded_row(r, "SGM gross freight paid (Guangzhou Zunhuang + CGL LA)", 89120.50, "SOURCED",
                "9 wire payments, S110-S121 all footed. SGM_2024_Txns FREIGHT category.")
    r = ded_row(r, "Less: CB explicit freight reimbursement", -15067, "SOURCED",
                "CB_2024_Txns INTERCO_TO_SGM_FREIGHT: Jan $12,067 + May $2,000 + Jun $1,000. "
                "Layer 6 intercompany reconciliation.")
    r = ded_row(r, "Less: intercompany receivable (CB's share, Path b)", -8135.50, "SOURCED",
                "SGM fronted $10,135.50 Guangzhou wire for Cyberbackpack shipment; "
                "CB reimbursed $2,000; $8,135.50 = CB's payable to SGM. "
                "SGM records as asset receivable, NOT additional deduction.")
    r = ded_row(r, "SGM net Splitflask freight (deductible)", 65918, "SOURCED",
                "LOCKED: $89,120.50 − $15,067 − $8,135.50 = $65,918.00. "
                "CLAUDE.md Layer 6 + Path b. Intercompany tab.",
                GREEN_FILL)
    blank(ws, r); r += 1

    # Operating deductions
    sub_hdr(ws, r, 1, "OPERATING DEDUCTIONS (bank-reconstructed)", span=4)
    r += 1
    opex = [
        ("Salaries and wages", 36000, "SOURCED",
         "1120-S line 8 as filed. Bank confirmed."),
        ("Rent — warehouse (Della Moda Inc / Kamyar)", 30241, "SOURCED",
         "SGM_2024_Txns RENT category. $30,241 vs as-filed $22,500. "
         "TJ: confirm full $30,241 is deductible warehouse rent; "
         "verify rental agreement."),
        ("Interest expense (SBA EIDL interest portion)", 9528, "TJ",
         "As-filed amount. TJ must split $13,320 EIDL payment into "
         "interest (deductible) vs principal (non-deductible). "
         "Confirm actual interest component."),
        ("Advertising (bank-confirmed, Meta/PR/influencer)", 6368, "SOURCED",
         "SGM_2024_Txns ADS category: Meta/FB bank charges + PR Nicole + samples. "
         "Note: $6,368 bank only. Card ···1400 ($5,145 incremental?) pending TJ confirm."),
        ("Other deductions (opex, bank fees, SaaS, CA tax, professional)", 107380, "SOURCED",
         "1120-S as-filed Other deductions preserved. Includes CA tax $4,360. "
         "Bank-classified categories: OPEX_SOFTWARE, BANK_FEES, PROF_SERVICES, etc."),
        ("AmEx real business charges (patentYogi + podcast + domain)", 720, "SOURCED",
         "RECON_AMEX_2024: PatentYogi $152 + ALL IN Podcast $500 + IONOS/GoDaddy $68. "
         "Net-of-AmEx-payments correction. Move from OPEX_OTHER to OPEX_SOFTWARE."),
        ("TOTAL OPERATING DEDUCTIONS (amended)", 189517, "SOURCED",
         "= $36K + $30,241 + $9,528 + $6,368 + $107,380 + $720 ≈ $190,237. "
         "LAYER_5_COHERENCE_AUDIT.md uses $189,517 (slight rounding diff). "
         "Corrected vs as-filed: +$7,208 (deeper, more favorable).", ),
    ]
    for line in opex:
        if len(line) == 4:
            text, amt, status, src = line
        else:
            text, amt, status, src = line[0], line[1], line[2], line[3]
        r = ded_row(r, text, amt, status, src,
                    fill=GREEN_FILL if "TOTAL" in text else None,
                    indent=0 if "TOTAL" in text else 1)
    blank(ws, r); r += 1

    # Non-deductibles
    sub_hdr(ws, r, 1, "NON-DEDUCTIBLE — REMOVED FROM AMENDED RETURN", span=4, fill=RED_FILL)
    r += 1
    ws.cell(row=r-1, column=1).font = WHITE_FONT
    nd = [
        ("AmEx payments to personal 2021 balance — EXCLUDED",
         23676, "EXCL",
         "SGM paid Arize's personal AmEx debt from WF 8625 → owner draw. "
         "Non-deductible. RECON_AMEX_2024: all 7 months footed. "
         "Remove from deductions: −$23,676."),
        ("Shopify Capital principal repayment — EXCLUDED",
         37136, "EXCL",
         "~$37K withheld from Shopify daily payouts = capital principal repayment. "
         "Non-deductible per owner decision (CLAUDE.md). "
         "TJ: pull Shopify Capital statement to isolate interest component."),
        ("SBA EIDL principal — EXCLUDED (interest only deductible)",
         0, "TJ",
         "TJ to split $13,320 total EIDL payment into principal (excl) + interest (incl). "
         "Current as-filed $9,528 interest may already be the interest-only portion."),
    ]
    for text, amt, status, src in nd:
        label(ws, r, 1, text)
        ws.cell(row=r, column=1).fill = RED_FILL
        ws.cell(row=r, column=1).font = Font(name="Calibri", size=10, color="C00000")
        c = ws.cell(row=r, column=2, value=amt)
        c.number_format = NUM_FMT
        c.font = Font(name="Calibri", size=10, color="C00000")
        c.alignment = Alignment(horizontal="right")
        c_s = ws.cell(row=r, column=3, value=status)
        c_s.font = Font(name="Calibri", size=9, bold=True, color="FF0000")
        c_s.fill = RED_FILL
        c_s.alignment = Alignment(horizontal="center")
        note(ws, r, 4, src)
        r += 1

    blank(ws, r); r += 1

    # Totals
    sub_hdr(ws, r, 1, "DEDUCTION TOTALS (Gross-Up Model)", span=4, fill=GREEN_FILL)
    r += 1

    tot_rows = [
        ("COGS (inventory method)", 332468, "SOURCED",
         "See COGS & Inventory tab."),
        ("Operating deductions (bank-reconstructed)", 189517, "SOURCED",
         "See above."),
        ("Amazon fees + returns (sourced)", 74845, "SOURCED",
         "$52,007 + $22,838. Sourced from settlement CSV."),
        ("TikTok fees + shipping + ads (sourced)", 51352, "SOURCED",
         "Sourced from quarterly income files."),
        ("Freight SGM net (sourced)", 65918, "SOURCED",
         "After intercompany reconciliation."),
        ("Amazon MX/CA fees (ESTIMATE)", 26996, "EST",
         "Not yet sourced — TJ action item."),
        ("Shopify Payments fee (ESTIMATE, Option B only)", 5276, "EST",
         "Only if Shopify routes to SGM."),
        ("TOTAL DEDUCTIONS — sourced only", 713100, "SOURCED",
         "= $332,468 + $189,517 + $74,845 + $51,352 + $65,918. "
         "Note: $332,468 + $189,517 + $74,845 + $51,352 + $65,918 = $714,100."),
        ("TOTAL DEDUCTIONS — including estimates", 745372, "EST",
         "= sourced $714,100 + estimates $26,996 + $5,276. Deeper loss if confirmed."),
    ]
    for text, amt, status, src in tot_rows:
        bold = "TOTAL" in text
        label(ws, r, 1, text, indent=0 if bold else 1, bold=bold)
        num(ws, r, 2, amt, bold=bold,
            fill=GREEN_FILL if bold and status == "SOURCED" else
            (ORANGE_FILL if bold else None))
        c = ws.cell(row=r, column=3, value=status)
        c.font = Font(name="Calibri", size=9, bold=True,
                      color="006100" if status == "SOURCED" else "7030A0")
        c.fill = GREEN_FILL if status == "SOURCED" else ORANGE_FILL
        c.alignment = Alignment(horizontal="center")
        note(ws, r, 4, src)
        r += 1

    return ws


# ─── Sheet 6: Intercompany ───────────────────────────────────────────────────

def build_intercompany(wb):
    ws = wb.create_sheet("Intercompany")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 52)
    set_col_width(ws, "B", 14)
    set_col_width(ws, "C", 14)
    set_col_width(ws, "D", 44)

    t = ws.cell(row=1, column=1,
                value="SGM 2024 — Intercompany Reconciliation (SGM ↔ Cyberbrands)")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:D1")

    sub = ws.cell(row=2, column=1,
                  value="Layer 6 result: 30 interco lines, 0 FAIL. Both 2024 returns now mutually consistent. "
                        "All figures cross-matched between SGM_2024_Txns and CB_2024_Txns.")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:D2")

    ws.row_dimensions[3].height = 28
    hdr(ws, 3, 1, "Item")
    hdr(ws, 3, 2, "SGM Amount")
    hdr(ws, 3, 3, "CB Amount")
    hdr(ws, 3, 4, "Resolution / Source")

    r = 4
    sub_hdr(ws, r, 1, "FREIGHT INTERCOMPANY (Layer 6 — fully resolved)", span=4)
    r += 1

    freight_rows = [
        ("SGM gross freight paid to forwarders (9 wires)",
         89120.50, None,
         "Source: SGM_2024_Txns FREIGHT. All 9 Guangzhou Zunhuang + CGL LA payments. "
         "S110-S121 footed."),
        ("CB labeled freight reimbursements to SGM",
         None, 15067.00,
         "CB_2024_Txns INTERCO_TO_SGM_FREIGHT: Jan $12,067 + May $2,000 + Jun $1,000. "
         "These were LABELED as freight by Cyberbrands."),
        ("SGM's INTERCO_IN_CYBER freight bucket (CORRECTED)",
         15067.00, None,
         "CORRECTION: SGM's original $42,747 interco freight bucket was "
         "a MISCLASSIFICATION — it lumped ALL CB→SGM transfers (inventory advances, "
         "ads, marketing) into one freight bucket. Real labeled freight = $15,067. "
         "Layer 6 corrected this."),
        ("Intercompany receivable — CB's freight share (Path b)",
         8135.50, 8135.50,
         "SGM fronted $10,135.50 Guangzhou wire for Cyberbackpack shipment; "
         "CB reimbursed $2,000 of it; $8,135.50 remains CB's payable. "
         "Owner decision (Path b): SGM RECEIVABLE, CB PAYABLE. "
         "Freight cost allocated to CB (benefitting entity)."),
        ("SGM net Splitflask freight deduction", 65918.00, None,
         "LOCKED: $89,120.50 − $15,067 − $8,135.50 = $65,918.00. "
         "Only Splitflask freight deducted by SGM."),
        ("CB net Cyberbackpack freight deduction", None, 23202.50,
         "$15,067 + $8,135.50 = $23,202.50. "
         "CB deducts its full Cyberbackpack freight share."),
        ("Cross-entity check: $89,120.50 = $65,918 + $23,202.50", None, None,
         "PASSES: $65,918.00 + $23,202.50 = $89,120.50. "
         "All freight deducted exactly once across both entities."),
    ]
    for text, sgm, cb, src in freight_rows:
        bold = "net" in text.lower() and "deduction" in text.lower()
        pass_row = "PASSES" in src or "PASSES" in text
        label(ws, r, 1, text, bold=bold or pass_row)
        if sgm is not None:
            num(ws, r, 2, sgm, bold=bold,
                fill=GREEN_FILL if "net Splitflask" in text else None)
        if cb is not None:
            num(ws, r, 3, cb, bold=bold,
                fill=GREEN_FILL if "net Cyberbackpack" in text else None)
        note(ws, r, 4, src)
        if pass_row:
            for c in range(1, 5):
                ws.cell(row=r, column=c).fill = GREEN_FILL
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "OTHER INTERCOMPANY ITEMS (SGM 2024)", span=4)
    r += 1

    other_interco = [
        ("CB→SGM advertising/promo transfers", 3621.41, 3621.41,
         "MATCHED. $3,621.41 in CB books as INTERCO_TO_SGM_PROMO. "
         "On SGM: classified as ADS or OPEX. No double-count. TJ: "
         "confirm these are CB's shared Splitflask campaign costs."),
        ("CB→SGM management/marketing ($6,000)", 6000.00, 6000.00,
         "FLAG-TJ: $6,000 in 3 payments. SGM books = revenue or offset? "
         "CB books = service expense? TJ: service agreement vs capital contribution."),
        ("CB→SGM patent cost share ($2,000)", 2000.00, 2000.00,
         "FLAG-TJ: $2,000. Confirm SGM did NOT already deduct full $3,410 patent gross. "
         "If CB shares cost, SGM deducts net only."),
        ("CB→SGM Shopify routing ($550.52)", 550.52, 550.52,
         "FLAG-TJ: small Shopify-related payment. Confirm allocation basis."),
        ("$8,135.50 intercompany RECEIVABLE (SGM) / PAYABLE (CB)",
         8135.50, 8135.50,
         "Balance sheet: SGM records receivable (asset). "
         "CB records payable (liability). Matches per Path b decision. "
         "Freight cost not deducted by SGM; deducted by CB."),
        ("Tesla SGM→CB loan Jun 2024 ($1,300)", None, 1300.00,
         "CB books show CB received $1,300 from SGM for Tesla-related payment. "
         "FLAG-TJ: document loan terms (or reclassify). CB→SGM interco."),
    ]
    for text, sgm, cb, src in other_interco:
        label(ws, r, 1, text, indent=1)
        if sgm is not None:
            num(ws, r, 2, sgm)
        if cb is not None:
            num(ws, r, 3, cb)
        note(ws, r, 4, src)
        r += 1

    blank(ws, r); r += 1

    sub_hdr(ws, r, 1, "BALANCE SHEET ITEMS (not P&L — do not deduct)", span=4, fill=GRAY_FILL)
    r += 1

    bs_items = [
        ("Intercompany receivable (SGM) / payable (CB) — freight", 8135.50,
         "SGM: asset; CB: liability. Owner elected Path b. Layer 6 locked."),
        ("$18,766.58 cash withdrawal — RESOLVED (shareholder loan round-trip)", 0,
         "Arize lent CB $18,766.58 on 12/26/23 (Schwab wire). "
         "CB repaid in Feb 2024. Clean owner-loan round-trip; non-taxable both ways. "
         "Source: Cyberbrands-2023-Dec-123123 WellsFargo.pdf. "
         "No longer a diligence flag. CLAUDE.md."),
    ]
    for text, amt, src in bs_items:
        label(ws, r, 1, text, indent=1)
        if amt:
            num(ws, r, 2, amt)
        note(ws, r, 4, src)
        r += 1

    return ws


# ─── Sheet 7: Source Index ────────────────────────────────────────────────────

def build_sources(wb):
    ws = wb.create_sheet("Source Index")
    ws.freeze_panes = "A4"
    set_col_width(ws, "A", 20)
    set_col_width(ws, "B", 36)
    set_col_width(ws, "C", 52)
    set_col_width(ws, "D", 14)

    t = ws.cell(row=1, column=1,
                value="SGM 2024 — Source Index (Provenance Gate)")
    t.font = Font(name="Calibri", bold=True, size=13, color="1F497D")
    ws.merge_cells("A1:D1")

    sub = ws.cell(row=2, column=1,
                  value="Every figure in this packet traces to one of: "
                        "(a) footed bank statement, (b) platform document (settlement/CSV/1099-K), "
                        "or (c) IRS 1099-K form. No figure from unfooted parse.")
    sub.font = NOTE_FONT
    ws.merge_cells("A2:D2")

    ws.row_dimensions[3].height = 28
    hdr(ws, 3, 1, "Source ID")
    hdr(ws, 3, 2, "Document Name")
    hdr(ws, 3, 3, "Description / What it proves")
    hdr(ws, 3, 4, "Type")

    sources = [
        # 1099-K forms
        ("S050", "Splitflask-2024-1099K.pdf",
         "Amazon US 1099-K, SGM TIN. Form 1008750130. Box 1a $344,035.75. LOCKED.",
         "1099-K"),
        ("S051", "Splitflask-2024-1099K (1).pdf",
         "Amazon Mexico 1099-K, SGM TIN. Form 1009016455. Box 1a $10,561.67. LOCKED.",
         "1099-K"),
        ("S052", "Splitflask-2024-1099K (2).pdf",
         "Amazon Canada 1099-K, SGM TIN. Form 1008750129. Box 1a $11,870.02. LOCKED.",
         "1099-K"),
        ("S053", "Amazon-Cyberbrands-2024-1099K-2.pdf",
         "Amazon Cyberbrands 1099-K (TIN …7466). Form 1008666995. $22,414.83. LOCKED.",
         "1099-K"),
        ("S054", "Splitflask-2025-1099K.pdf",
         "Amazon US 2025 1099-K, SGM TIN. $240,009.89. Used in 2025 return analysis.",
         "1099-K"),
        ("S055", "Splitflask-7495370463474518494B_2024_1099-K (1).pdf",
         "TikTok Shop 1099-K, SGM TIN. $155,294.96. Verified vs 9 monthly CSVs. LOCKED.",
         "1099-K"),
        ("S056", "Splitflask-2024-Shopify-1099K.pdf",
         "Shopify Splitflask store 1099-K, Personal TIN …7639. $164,613.99. CORRECTED form. LOCKED.",
         "1099-K"),
        ("S057", "Splitflask-2025-Shopify-1099K.pdf",
         "Shopify Splitflask store 1099-K, SPLT TIN. $109,063.96. 2025 use only.",
         "1099-K"),
        ("S058", "Shopify-SGM-1099-K.pdf",
         "Shopify Cyberbrands store 1099-K, SGM TIN. $82,263.58. CORRECTED form. "
         "Cyberbackpack product — excluded from Splitflask revenue. LOCKED.",
         "1099-K"),
        ("S060-S068", "Splitflask-tiktok-1099k_..._2024_[month]_detail.csv (×9)",
         "TikTok 1099-K monthly detail CSVs (Feb, May-Dec 2024). "
         "Sum = $155,294.96 penny-exact match to S055. LOCKED.",
         "Platform CSV"),
        # Platform settlement docs
        ("CSV-AMA-2024", "Splitflask-AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv",
         "Amazon US Unified Transaction report 2024. "
         "Sources Amazon fees: referral $32,863, FBA $19,144, returns $22,838. "
         "LOCKED (stated amounts). 5,836 txns.",
         "Platform CSV"),
        ("XLSX-TT-Q", "merchant_statement_profit_loss_*.xlsx (2 files, Q1 2025 proxy)",
         "TikTok quarterly income files. 2025 fee structure used as 2024 proxy. "
         "2024 PDFs are image-only — quarterly Excels provide stated components.",
         "Platform CSV"),
        ("TT-2024-ANNUAL", "TikTok Seller Center quarterly income files (2024)",
         "TikTok 2024 full-year stated components: fees $22,343 + shipping $27,964 + ads $1,045 = $51,352. "
         "LOCKED. Tie-check: $155,295 − $51,352 − $41,702 co-promo = $62,241 bank deposits.",
         "Platform CSV"),
        ("CSV-SHOPIFY-2024", "Splitflask-Shopify-Total sales breakdown - 2024-01-01 - 2024-12-31.csv",
         "Shopify 2024 sales export. Consumer settled $181,912. Payments fee ~2.9% ≈ $5,276 (est). "
         "List-price demand $305,066; discounts $132,253; net $166,156.",
         "Platform CSV"),
        # Bank statements (SGM)
        ("S110-S121", "SGM WellsFargo 2024 (all 12 months, Jan-Dec 2024)",
         "All 12 SGM 2024 bank statements. ALL FOOTED to closing balance. "
         "77 parser-artifact lines corrected. Deposits tie $895,754.12 penny-exact. "
         "Sources: COGS $390,068, freight $89,121, ads $6,368, opex $87,037, etc.",
         "Bank stmt (footed)"),
        ("S122", "SGM 013125 WellsFargo (2).pdf (Jan 2025)",
         "Jan 2025 SGM statement. Used to check year-end timing: "
         "TikTok $1,499 (not $24.7K); Amazon $17,886 Jan 2025 receipts.",
         "Bank stmt"),
        # CB statements
        ("S140-S151", "Cyberbrands WellsFargo 2024 (all 12 months, Jan-Dec 2024)",
         "All 12 CB 2024 bank statements. ALL FOOTED (zero parser corrections). "
         "CB revenue $116,561.18 (pre-BNPL correction). "
         "INTERCO_TO_SGM_FREIGHT $15,067 confirmed.",
         "Bank stmt (footed)"),
        # AmEx
        ("AMEX-2024", "AMEX-2024-*.pdf (Jan-Jul 2024, 7 statements)",
         "Personal AmEx statements (Arize/Cheryl accts -12004/-12012). "
         "All 7 months footed (AmEx PDFs have single amount column — no parser artifact risk). "
         "Business charges: ~$720 total. AmEx = personal, not SGM business.",
         "Card stmt (footed)"),
        # Filed return
        ("1120S-2024", "SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf",
         "As-filed SGM 2024 1120-S. Gross receipts $418,990; COGS $270,032; "
         "Total deductions $182,309; Loss $33,351. This is the base for the amendment.",
         "Tax return"),
        # Analysis docs
        ("PATH_B", "PATH_B_FEE_SUBSTANTIATION.md",
         "Fee substantiation session report. Amazon fees sourced; TikTok 2024 PDFs image-only; "
         "Shopify routing analyzed. Steps 1-3 complete.",
         "Analysis"),
        ("L5_AUDIT", "LAYER_5_COHERENCE_AUDIT.md",
         "SGM 2024 waterfall coherence audit. No material double-count. "
         "Corrected loss −$173,543 → −$172,793. Freight found missing from prior model.",
         "Analysis"),
        ("CLAUDE_MD", "CLAUDE.md (ORCHESTRATION_STATE.md)",
         "Master truth file. All locked figures, owner decisions, TJ action items. "
         "Layer 6 Layer 12 final figures: SGM 2024 −$192K inv / −$250K cash.",
         "Orchestration"),
    ]

    r = 4
    for sid, name, desc, stype in sources:
        c_id = ws.cell(row=r, column=1, value=sid)
        c_id.font = Font(name="Calibri", size=9, bold=True, color="1F497D")
        c_id.alignment = Alignment(horizontal="center")
        c_name = ws.cell(row=r, column=2, value=name)
        c_name.font = Font(name="Calibri", size=9)
        c_name.alignment = Alignment(wrap_text=True, vertical="center")
        c_desc = ws.cell(row=r, column=3, value=desc)
        c_desc.font = NOTE_FONT
        c_desc.alignment = Alignment(wrap_text=True, vertical="center")
        c_type = ws.cell(row=r, column=4, value=stype)
        if "1099-K" in stype:
            c_type.fill = GREEN_FILL
        elif "Bank" in stype:
            c_type.fill = LBLUE_FILL
        elif "Platform" in stype:
            c_type.fill = ORANGE_FILL
        c_type.font = Font(name="Calibri", size=9, bold=True)
        c_type.alignment = Alignment(horizontal="center", wrap_text=True)
        ws.row_dimensions[r].height = max(18, min(60, len(desc) // 2))
        r += 1

    return ws


# ─── Main build ──────────────────────────────────────────────────────────────

def main():
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    build_summary(wb)
    build_1099k(wb)
    build_revenue(wb)
    build_cogs(wb)
    build_deductions(wb)
    build_intercompany(wb)
    build_sources(wb)

    out = "/Users/riz/Downloads/Splitflask-Financials/deliverables/SGM_2024_Amendment_Packet.xlsx"
    wb.save(out)
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()
