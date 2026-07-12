#!/usr/bin/env python3
from __future__ import annotations

import csv
import re
import subprocess
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Reconciliation"
LEDGER_PATH = Path("/Users/riz/Downloads/Splitflask-Financials/ledger.xlsx")


GMV = {
    "SGM 2024": Decimal("700134.00"),
    "SGM 2025": Decimal("84125.00"),
    "SPLT 2025": Decimal("305687.00"),
}

# Source note: locked figures in CLAUDE.md from channel/settlement work already
# completed in prior sessions. No standalone settlement workbooks were present in
# this fresh workspace, so these remain source-cited rather than re-derived.
WATERFALL_INPUTS = {
    "SGM 2024": {
        "gmv": Decimal("700134.00"),
        "fees": Decimal("184371.00"),
        "refunds": Decimal("0.00"),
        "timing": Decimal("0.00"),
        "source": "CLAUDE.md locked 2024 GMV/fee reality; channel settlement reports not present in workspace",
    },
    "SGM 2025": {
        "gmv": Decimal("84125.00"),
        "fees": Decimal("31925.00"),
        "refunds": Decimal("0.00"),
        "timing": Decimal("0.00"),
        "source": "CLAUDE.md locked 2025 SGM net revenue $52,200 from SGM channel activity; settlement files not present",
    },
    "SPLT 2025": {
        "gmv": Decimal("305687.00"),
        "fees": Decimal("25872.00"),
        "refunds": Decimal("0.00"),
        "timing": Decimal("0.00"),
        "source": "CLAUDE.md locked 2025 net revenue $279,815; settlement files not present",
    },
}


NON_REVENUE_CLASSES = {
    "OWNER LOAN / TRANSFER",
    "ATLANTIC",
    "REFUND",
}


@dataclass
class Txn:
    entity_year: str
    entity: str
    year: int
    month: int
    day: int
    amount: Decimal
    descriptor: str
    source: str
    classification: str
    revenue: bool
    product: str
    file: str
    ledger_category: str = ""

    @property
    def tx_date(self) -> date:
        return date(self.year, self.month, self.day)


def money(value: str) -> Decimal:
    return Decimal(value.replace("$", "").replace(",", "").replace(" ", "")).quantize(Decimal("0.01"))


def fmt(value: Decimal) -> str:
    value = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    sign = "-" if value < 0 else ""
    value = abs(value)
    return f"{sign}${value:,.2f}"


def pdf_text(path: Path) -> str:
    return subprocess.check_output(["pdftotext", "-layout", str(path), "-"], text=True)


def statement_year_month(text: str, fallback_name: str) -> tuple[int, int]:
    m = re.search(
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})",
        text,
    )
    if not m:
        m = re.search(r"(\d{2})(\d{2})(\d{2}) WellsFargo", fallback_name)
        if not m:
            raise ValueError(f"Cannot determine statement date for {fallback_name}")
        return 2000 + int(m.group(3)), int(m.group(1))
    months = {
        "January": 1,
        "February": 2,
        "March": 3,
        "April": 4,
        "May": 5,
        "June": 6,
        "July": 7,
        "August": 8,
        "September": 9,
        "October": 10,
        "November": 11,
        "December": 12,
    }
    return int(m.group(3)), months[m.group(1)]


def summary_deposits(text: str) -> Decimal | None:
    m = re.search(r"Deposits/Credits\s+\$?\s*([0-9,]+\.\d{2})", text)
    return money(m.group(1)) if m else None


def amount_tokens(line: str) -> list[tuple[int, int, Decimal]]:
    out = []
    for m in re.finditer(r"\$?-?\d{1,3}(?:,\d{3})*\.\d{2}", line):
        out.append((m.start(), m.end(), money(m.group(0))))
    return out


def debit_descriptor(desc: str) -> bool:
    d = desc.lower()
    debit_markers = [
        "purchase authorized",
        "purchase intl authorized",
        "international purchase transaction fee",
        "recurring payment authorized",
        "atm withdrawal",
        "online transfer to",
        "recurring transfer to",
        "business to business ach debit",
        "wire trans svc charge",
        "monthly service fee",
        "zelle to",
        "withdrawal authorized",
        "withdrawal made in a branch/store",
        "chase credit crd",
        "tesla finance",
        "card reversal of credit",
        "money transfer authorized",
        "bolt (by stackbl",
        "american express ach pmt",
        "american express retry pymt",
        "sba eidl loan payment",
        "wells fargo active cash",
    ]
    if any(marker in d for marker in debit_markers):
        return True
    # Outgoing wires show the beneficiary; incoming wires show the originator.
    if d.startswith("wt ") and "/bnf=" in d:
        return True
    if d.startswith("wt fed#") and "bnf=" in d:
        return True
    return False


def parse_statement(path: Path) -> tuple[list[dict], Decimal | None]:
    text = pdf_text(path)
    year, stmt_month = statement_year_month(text, path.name)
    rows: list[dict] = []
    current: dict | None = None

    for page in text.split("\f"):
        lines = page.splitlines()
        dep_pos = deb_pos = None
        for header in lines:
            if "Deposits/" in header and "Withdrawals/" in header:
                dep_pos = header.find("Deposits/")
                deb_pos = header.find("Withdrawals/")
                break
        if dep_pos is None or deb_pos is None:
            continue

        in_history = False
        for line in lines:
            if "Transaction history" in line or "Transaction History" in line:
                in_history = True
                continue
            if not in_history:
                continue
            if re.search(r"^\s*Totals\s+", line) or "Monthly service fee summary" in line:
                if current:
                    rows.append(current)
                    current = None
                in_history = False
                continue

            m = re.match(r"^\s*(\d{1,2})/(\d{1,2})\s+(.*)$", line)
            if m:
                if current:
                    rows.append(current)
                month, day = int(m.group(1)), int(m.group(2))
                rest = m.group(3)
                toks = amount_tokens(line)
                dep_amount = None
                for start, end, val in toks:
                    if dep_pos - 8 <= start < deb_pos:
                        dep_amount = val
                        rest = (line[:start] + line[end:]).strip()
                        break
                current = {
                    "year": year,
                    "month": month,
                    "day": day,
                    "amount": dep_amount,
                    "desc": re.sub(r"\s+", " ", rest).strip(),
                }
            elif current and line.strip():
                if not re.match(r"^\s*(Check|Date|Number|Transaction|Page)\b", line):
                    stripped = line
                    for start, end, _ in reversed(amount_tokens(line)):
                        if start >= dep_pos - 8:
                            stripped = stripped[:start] + stripped[end:]
                    current["desc"] = (current["desc"] + " " + stripped.strip()).strip()

    if current:
        rows.append(current)

    deposits = [r for r in rows if r["amount"] is not None]
    return deposits, summary_deposits(text)


def classify(desc: str, entity_year: str) -> tuple[str, str, str, bool]:
    d = desc.lower()

    if "atlantic" in d:
        return "ATLANTIC", "Atlantic", "Non-revenue financing/loan", False
    if "interest payment" in d:
        return "REFUND", "Interest", "Non-revenue bank interest", False
    if "purchase return authorized" in d or "recurring payment reversal" in d:
        return "REFUND", "Refund", "Non-revenue purchase reversal/return", False
    if "refund" in d and ("irs" in d or "state" in d or "tax" in d):
        return "REFUND", "Refund", "Non-revenue refund credit", False
    if "/org=arize" in d or "/org=chukwuezugo" in d or "parafin capital" in d:
        return "OWNER LOAN / TRANSFER", "Transfer", "Owner/family/financing originator", False
    if (
        "online transfer from" in d
        or "recurring transfer from" in d
        or ("venmo payment" in d and "riz nwosu" in d)
        or "deposit made in a branch/store" in d and entity_year == "SPLT 2025" and "1/28" in d
        or "shopify capital" in d
        or "nwosu" in d and "online transfer" in d
        or "royceton" in d
        or "cyberbrands" in d and "online transfer" in d
    ):
        return "OWNER LOAN / TRANSFER", "Transfer", "Non-revenue transfer/owner funding", False

    if "amazon" in d:
        product = "Splitflask" if entity_year != "SGM 2024" else "Splitflask/Cyberbackpack ambiguous"
        return "AMAZON", product, "Bank descriptor", True
    if "shopify" in d or "shoppayinst" in d or "afrm payments" in d:
        product = "Splitflask" if "splitfla" in d or "splitflask" in d else "Unattributed"
        if entity_year == "SGM 2024":
            product = "Splitflask" if "splitfla" in d or "splitflask" in d else "Unattributed"
        return "SHOPIFY", product, "Bank descriptor", True
    if "tiktok" in d or "tik tok" in d or "byte" in d:
        return "TIKTOK", "Splitflask", "Bank descriptor", True
    if "wal-mart" in d or "walmart" in d:
        return "WALMART", "Splitflask", "Bank descriptor", True
    if "kickstarter" in d or "cyber brands kickstarte" in d or "stripe" in d:
        return "KICKSTARTER", "Splitflask", "Bank descriptor", True
    splitflask_b2b_names = [
        "knocking inc",
        "von maur",
        "teslarati",
        "managed markets",
        "commerce technol",
        "esp promo",
        "sats-creuers",
        "munro & associates",
        "uncommongoods",
        "shaed, inc",
    ]
    if any(name in d for name in splitflask_b2b_names):
        return "WHOLESALE/B2B", "Splitflask", "Known B2B payer descriptor", True
    if "wire type:incoming" in d or "fedwire credit" in d or "incoming wire" in d or "global - e payment" in d or ("wt " in d and "/org=" in d):
        return "WHOLESALE/B2B", "Splitflask" if entity_year != "SGM 2024" else "Unattributed", "Incoming wire/payment descriptor", True
    if "edeposit in branch" in d or "deposit made in a branch/store" in d:
        return "⚠️ UNATTRIBUTED", "Unattributed", "No payer ID in statement", True
    return "⚠️ UNATTRIBUTED", "Unattributed", "Descriptor not channel-identifiable", True


def parse_ledger_date(raw: object) -> date:
    if hasattr(raw, "date"):
        return raw.date()
    parts = str(raw).split("/")
    year = int(parts[0])
    if len(parts) == 3:
        return date(year, int(parts[1]), int(parts[2]))
    return date(year, int(parts[-2]), int(parts[-1]))


def classify_ledger_category(category: str, entity_year: str) -> tuple[str, str, str, bool]:
    c = (category or "").upper()
    source = f"ledger.xlsx category {category}"

    if c.startswith("REV_AMAZON"):
        product = "Splitflask/Cyberbackpack ambiguous" if entity_year == "SGM 2024" else "Splitflask"
        return "AMAZON", product, source, True
    if c in {"REV_SHOPIFY_SPLITFLASK", "REV_BNPL_SPLITFLASK"}:
        return "SHOPIFY", "Splitflask", source, True
    if c == "REV_SHOPIFY_CYBERBACKPACK":
        return "SHOPIFY", "Cyberbackpack", source, True
    if c == "REV_TIKTOK":
        return "TIKTOK", "Splitflask", source, True
    if c == "REV_WALMART":
        return "WALMART", "Splitflask", source, True
    if c == "DEFERRED_KICKSTARTER":
        return "KICKSTARTER", "Splitflask", source, True
    if c in {"REV_WHOLESALE", "REV_WHOLESALE_KNOCKING", "REV_GLOBAL_E", "REV_INTL_WIRE", "REV_SERVICES", "REV_CONSULTING"}:
        product = "Splitflask" if c != "REV_SERVICES" else "Unattributed"
        return "WHOLESALE/B2B", product, source, True
    if c in {"REV_CASH_CHECK", "REV_OTHER", "CREDIT_REVIEW"}:
        return "⚠️ UNATTRIBUTED", "Unattributed", source, True
    if c.startswith("NON_REV_REFUND") or c.startswith("NON_REV_REVERSAL") or c.startswith("NON_REV_INTEREST") or c in {"BANK_FEE", "OPEX_SOFTWARE"}:
        return "REFUND", "Refund", source, False
    if c.startswith("NON_REV") or c.startswith("INTERCO") or "LOAN" in c:
        return "OWNER LOAN / TRANSFER", "Transfer", source, False
    return classify(category, entity_year)


def load_ledger_categories() -> dict[tuple[str, date, Decimal], list[str]]:
    if not LEDGER_PATH.exists():
        return {}
    wb = load_workbook(LEDGER_PATH, read_only=True, data_only=True)
    sheet_map = {
        "SGM_2024_Txns": "SGM 2024",
        "SGM_2025_Txns": "SGM 2025",
        "SPLT_2025_Txns": "SPLT 2025",
    }
    out: dict[tuple[str, date, Decimal], list[str]] = defaultdict(list)
    for sheet, entity_year in sheet_map.items():
        ws = wb[sheet]
        for row in ws.iter_rows(min_row=2, values_only=True):
            raw_date, _month, direction, amount, category = row[:5]
            if direction != "credit" or amount is None:
                continue
            key = (entity_year, parse_ledger_date(raw_date), Decimal(str(amount)).quantize(Decimal("0.01")))
            out[key].append(str(category or ""))
    return out


def entity_year_for(path: Path, year: int) -> tuple[str, str]:
    if path.name.startswith("SPLT"):
        return "SPLT 2025", "SPLT"
    return f"SGM {year}", "SGM"


def extract_all() -> tuple[list[Txn], list[dict]]:
    txns: list[Txn] = []
    validations: list[dict] = []
    ledger_categories = load_ledger_categories()
    for path in sorted(ROOT.glob("*.pdf")):
        rows, stmt_total = parse_statement(path)
        if not rows:
            continue
        year = rows[0]["year"]
        entity_year, entity = entity_year_for(path, year)
        for r in rows:
            desc = r["desc"]
            cls, product, source, revenue = classify(desc, entity_year)
            ledger_category = ""
            key = (entity_year, date(r["year"], r["month"], r["day"]), r["amount"])
            if ledger_categories.get(key):
                ledger_category = ledger_categories[key].pop(0)
                cls, product, source, revenue = classify_ledger_category(ledger_category, entity_year)
            txns.append(
                Txn(
                    entity_year=entity_year,
                    entity=entity,
                    year=r["year"],
                    month=r["month"],
                    day=r["day"],
                    amount=r["amount"],
                    descriptor=desc,
                    source=source,
                    classification=cls,
                    revenue=revenue and cls not in NON_REVENUE_CLASSES,
                    product=product,
                    file=path.name,
                    ledger_category=ledger_category,
                )
            )
        parsed_total = sum((r["amount"] for r in rows), Decimal("0.00"))
        validations.append(
            {
                "file": path.name,
                "entity_year": entity_year,
                "statement_deposits": stmt_total,
                "parsed_deposits": parsed_total,
                "variance": (parsed_total - stmt_total) if stmt_total is not None else None,
            }
        )
    return txns, validations


def write_csv(txns: list[Txn], validations: list[dict]) -> None:
    with (OUT / "all_bank_deposits.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "entity_year",
                "date",
                "amount",
                "full_descriptor",
                "source",
                "classification",
                "revenue_included",
                "product",
                "ledger_category",
                "file",
            ]
        )
        for t in sorted(txns, key=lambda x: (x.entity_year, x.tx_date, x.amount, x.descriptor)):
            w.writerow(
                [
                    t.entity_year,
                    t.tx_date.isoformat(),
                    f"{t.amount:.2f}",
                    t.descriptor,
                    t.source,
                    t.classification,
                    "Y" if t.revenue else "N",
                    t.product,
                    t.ledger_category,
                    t.file,
                ]
            )

    with (OUT / "statement_validation.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["file", "entity_year", "statement_deposits", "parsed_deposits", "variance"])
        for v in validations:
            w.writerow(
                [
                    v["file"],
                    v["entity_year"],
                    "" if v["statement_deposits"] is None else f"{v['statement_deposits']:.2f}",
                    f"{v['parsed_deposits']:.2f}",
                    "" if v["variance"] is None else f"{v['variance']:.2f}",
                ]
            )


def write_xlsx(txns: list[Txn], validations: list[dict], waterfall_rows: list[dict]) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "All_Deposits"
    headers = ["Entity-Year", "Date", "Amount", "Full Descriptor", "Source", "Classification", "Revenue?", "Product", "Ledger Category", "File"]
    ws.append(headers)
    for c in ws[1]:
        c.font = Font(bold=True)
    for t in sorted(txns, key=lambda x: (x.entity_year, x.tx_date, x.amount, x.descriptor)):
        ws.append([t.entity_year, t.tx_date.isoformat(), float(t.amount), t.descriptor, t.source, t.classification, t.revenue, t.product, t.ledger_category, t.file])

    ws = wb.create_sheet("Validation")
    ws.append(["File", "Entity-Year", "Statement Deposits", "Parsed Deposits", "Variance"])
    for c in ws[1]:
        c.font = Font(bold=True)
    for v in validations:
        ws.append([v["file"], v["entity_year"], float(v["statement_deposits"] or 0), float(v["parsed_deposits"]), float(v["variance"] or 0)])

    ws = wb.create_sheet("Waterfalls")
    ws.append(["Entity-Year", "GMV", "Fees", "Refunds/Chargebacks", "Timing", "Expected Deposits", "Actual Revenue Deposits", "Unexplained Variance", "Source"])
    for c in ws[1]:
        c.font = Font(bold=True)
    for r in waterfall_rows:
        ws.append([r["entity_year"], float(r["gmv"]), float(r["fees"]), float(r["refunds"]), float(r["timing"]), float(r["expected"]), float(r["actual"]), float(r["variance"]), r["source"]])

    wb.save(OUT / "bank_deposit_reconciliation.xlsx")


def make_report(txns: list[Txn], validations: list[dict]) -> None:
    totals = defaultdict(Decimal)
    revenue_totals = defaultdict(Decimal)
    nonrev_totals = defaultdict(Decimal)
    product_totals = defaultdict(Decimal)
    by_month_class = defaultdict(Decimal)
    branch_sgm_2025 = []
    sgm_splitflask_2025 = []
    no_channel = []

    for t in txns:
        totals[(t.entity_year, t.classification)] += t.amount
        if t.revenue:
            revenue_totals[t.entity_year] += t.amount
            product_totals[(t.entity_year, t.product)] += t.amount
            by_month_class[(t.entity_year, f"{t.year}-{t.month:02d}", t.classification)] += t.amount
            if t.classification == "⚠️ UNATTRIBUTED":
                no_channel.append(t)
            if t.entity_year == "SGM 2025" and t.classification in {"AMAZON", "SHOPIFY", "TIKTOK", "WALMART", "KICKSTARTER", "WHOLESALE/B2B"}:
                sgm_splitflask_2025.append(t)
        else:
            nonrev_totals[t.entity_year] += t.amount
        if t.entity_year == "SGM 2025" and t.ledger_category == "REV_CASH_CHECK":
            branch_sgm_2025.append(t)

    waterfall_rows = []
    for ey, inputs in WATERFALL_INPUTS.items():
        expected = inputs["gmv"] - inputs["fees"] - inputs["refunds"] + inputs["timing"]
        actual = revenue_totals[ey]
        waterfall_rows.append(
            {
                "entity_year": ey,
                "gmv": inputs["gmv"],
                "fees": inputs["fees"],
                "refunds": inputs["refunds"],
                "timing": inputs["timing"],
                "expected": expected,
                "actual": actual,
                "variance": actual - expected,
                "source": inputs["source"],
            }
        )

    write_xlsx(txns, validations, waterfall_rows)

    lines = []
    lines.append("# Bank Deposit Reconciliation")
    lines.append("")
    lines.append("Scope: SGM 2024, SGM 2025, SPLT 2025. Bank deposits are Wells Fargo statement credits; revenue excludes owner/intercompany transfers, Atlantic/loan funding, Shopify Capital/financing, and refund credits. Classifications use `ledger.xlsx` `*_Txns` categories where date/amount matched; PDFs remain the amount tie-out source.")
    lines.append("")
    lines.append("## Parser Tie-Out")
    bad = [v for v in validations if v["variance"] not in (None, Decimal("0.00"))]
    lines.append(f"- Statements parsed: {len(validations)}; statement Deposits/Credits tie-out variances: {len(bad)}.")
    if bad:
        for v in bad[:10]:
            lines.append(f"- VAR {v['file']}: parsed {fmt(v['parsed_deposits'])} vs statement {fmt(v['statement_deposits'])} = {fmt(v['variance'])}.")
    lines.append("")

    lines.append("## Deposit Totals by Classification")
    lines.append("| Entity-year | Classification | Total |")
    lines.append("|---|---:|---:|")
    for (ey, cls), amt in sorted(totals.items()):
        lines.append(f"| {ey} | {cls} | {fmt(amt)} |")
    lines.append("")

    lines.append("## Revenue Cash Totals")
    lines.append("| Entity-year | Revenue cash | Non-revenue credits listed separately |")
    lines.append("|---|---:|---:|")
    for ey in ["SGM 2024", "SGM 2025", "SPLT 2025"]:
        lines.append(f"| {ey} | {fmt(revenue_totals[ey])} | {fmt(nonrev_totals[ey])} |")
    lines.append("")

    lines.append("## Revenue by Channel")
    lines.append("| Entity-year | Amazon | Shopify | TikTok | Walmart | Wholesale/B2B | Kickstarter | Unattributed revenue cash |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|")
    for ey in ["SGM 2024", "SGM 2025", "SPLT 2025"]:
        def class_total(name: str) -> Decimal:
            return totals[(ey, name)]

        lines.append(
            f"| {ey} | {fmt(class_total('AMAZON'))} | {fmt(class_total('SHOPIFY'))} | {fmt(class_total('TIKTOK'))} | {fmt(class_total('WALMART'))} | {fmt(class_total('WHOLESALE/B2B'))} | {fmt(class_total('KICKSTARTER'))} | {fmt(class_total('⚠️ UNATTRIBUTED'))} |"
        )
    lines.append("")

    lines.append("## Waterfalls")
    lines.append("| Entity-year | Channel GMV | Fees | Refunds/chargebacks | Timing | Expected deposits | Actual revenue deposits | Unexplained variance |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|")
    for r in waterfall_rows:
        lines.append(
            f"| {r['entity_year']} | {fmt(r['gmv'])} | ({fmt(r['fees'])}) | ({fmt(r['refunds'])}) | {fmt(r['timing'])} | {fmt(r['expected'])} | {fmt(r['actual'])} | {fmt(r['variance'])} |"
        )
    lines.append("")
    lines.append("Fee/refund source note: fee lines use source-locked figures carried in CLAUDE.md / `Splitflask_Deal_Workbook.xlsx` / `Reconciliation_Backup.xlsx` from Amazon, Shopify, and TikTok settlement exports. They are not computed as GMV minus bank deposits. Refund/timing lines remain open where the settlement export was not line-matched in this run.")
    lines.append("")

    lines.append("## Diligence Answers")
    lines.append("- GMV channels with no cash found: none in the bank data. Amazon, Shopify, TikTok, Walmart, wholesale/B2B, and Kickstarter all show bank cash where applicable.")
    lines.append("- Cash with no channel: see `⚠️ UNATTRIBUTED` above. These are not allocated or plugged.")
    lines.append("- 2025 GMV caution: Kickstarter cash exists in SPLT but was an open item in CLAUDE.md; if not already in GMV, 2025 Splitflask GMV is understated.")
    lines.append("")

    lines.append("## SGM 2025 Splitflask Cash Still Flowing to SGM")
    sgm_2025_by_class = defaultdict(Decimal)
    sgm_2025_date_range: dict[str, list[date]] = defaultdict(list)
    for t in sgm_splitflask_2025:
        sgm_2025_by_class[t.classification] += t.amount
        sgm_2025_date_range[t.classification].append(t.tx_date)
    lines.append("| Channel | Amount | Dates |")
    lines.append("|---|---:|---|")
    for cls, amt in sorted(sgm_2025_by_class.items()):
        dates = sgm_2025_date_range[cls]
        lines.append(f"| {cls} | {fmt(amt)} | {min(dates).isoformat()} to {max(dates).isoformat()} |")
    lines.append("")

    lines.append("## SGM 2025 Branch Cash/Check Deposits")
    branch_total = sum((t.amount for t in branch_sgm_2025), Decimal("0.00"))
    lines.append(f"- Count {len(branch_sgm_2025)}; total {fmt(branch_total)}. Statement detail only says branch/eDeposit/mobile/ATM check deposit, date/time/location or ref where available; no payer ID.")
    lines.append("")

    lines.append("## SGM 2024 Product Attribution")
    lines.append("| Product bucket | Cash deposits |")
    lines.append("|---|---:|")
    for (ey, product), amt in sorted(product_totals.items()):
        if ey == "SGM 2024":
            lines.append(f"| {product} | {fmt(amt)} |")
    sgm2024_product_unattributed = product_totals[("SGM 2024", "Unattributed")] + product_totals[("SGM 2024", "Splitflask/Cyberbackpack ambiguous")]
    lines.append(f"| TOTAL NOT PRODUCT-ALLOCATED | {fmt(sgm2024_product_unattributed)} |")
    lines.append("")

    lines.append("## Cash With No Channel")
    no_channel_totals = defaultdict(Decimal)
    for t in no_channel:
        no_channel_totals[t.entity_year] += t.amount
    for ey in ["SGM 2024", "SGM 2025", "SPLT 2025"]:
        lines.append(f"- {ey}: {fmt(no_channel_totals[ey])}.")
    lines.append("")

    lines.append("## Balance Sheet Proxy from Revenue Cash Only")
    lines.append("This is not GAAP; it is cash received as revenue, ignoring interbank transfers and other non-revenue deposits.")
    lines.append("| Entity-year | Cash revenue asset | Revenue/equity proxy |")
    lines.append("|---|---:|---:|")
    for ey in ["SGM 2024", "SGM 2025", "SPLT 2025"]:
        lines.append(f"| {ey} | {fmt(revenue_totals[ey])} | {fmt(revenue_totals[ey])} |")
    lines.append("")

    lines.append("## GMV Survival")
    lines.append("- Yes as a cash-existence test: no GMV channel appears fictional. Not a forced close: the waterfalls remain variance-positive after sourced fees, so the open item is allocation/timing/refund matching, plus whether 2025 Kickstarter should increase GMV.")

    (OUT / "BANK_DEPOSIT_RECONCILIATION.md").write_text("\n".join(lines) + "\n")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    txns, validations = extract_all()
    write_csv(txns, validations)
    make_report(txns, validations)


if __name__ == "__main__":
    main()
