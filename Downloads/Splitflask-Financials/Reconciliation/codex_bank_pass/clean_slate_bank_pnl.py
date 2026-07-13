#!/usr/bin/env python3
"""Cash-basis P&L from Wells Fargo statement PDFs only."""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "Reconciliation" / "clean_slate_pnl_output"

DATE_RE = re.compile(r"^\d{1,2}/\d{1,2}$")
MONEY_RE = re.compile(r"^\$?-?\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?$")
ACCOUNT_RE = re.compile(r"Account number:\s*([0-9 ]+)(?:\s*\(primary account\))?")
PERIOD_RE = re.compile(r"([A-Z][a-z]+ \d{1,2}, \d{4})\s+Page 1 of")
SUMMARY_DEPOSITS_RE = re.compile(r"Deposits/Credits\s+([0-9,]+\.\d{2})")
SUMMARY_WITHDRAWALS_RE = re.compile(r"Withdrawals/Debits\s*-\s*([0-9,]+\.\d{2})")


def money(value: str) -> Decimal:
    value = value.replace("$", "").replace(",", "").strip()
    neg = value.startswith("(") and value.endswith(")")
    value = value.strip("()")
    out = Decimal(value)
    return -out if neg else out


def fmt_money(value: Decimal) -> str:
    value = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return f"{value:,.2f}"


@dataclass
class Txn:
    source_file: str
    account: str
    account_number: str
    year: int
    month_end: str
    date: str
    side: str
    amount: Decimal
    descriptor: str
    counterparty: str
    pnl_section: str
    category: str
    subcategory: str
    confidence: str
    note: str


def pdf_files() -> list[Path]:
    return sorted(
        p for p in ROOT.glob("*.pdf") if p.name.startswith("SGM ") or p.name.startswith("SPLT-2025")
    )


def account_from_name(path: Path, account_no: str) -> str:
    if path.name.startswith("SGM ") or account_no.endswith("8625"):
        return "SGM"
    if path.name.startswith("SPLT-2025") or account_no.endswith("0423"):
        return "SPLT INC"
    return "UNKNOWN"


def statement_year_from_name(path: Path, month_end: str) -> int:
    m = re.search(r"(\d{6})", path.name)
    if m:
        return 2000 + int(m.group(1)[-2:])
    return int(month_end[-4:])


def line_words(page) -> list[list[dict]]:
    words = page.extract_words(x_tolerance=2, y_tolerance=3, keep_blank_chars=False)
    lines: list[list[dict]] = []
    for word in words:
        for line in lines:
            if abs(line[0]["top"] - word["top"]) <= 2:
                line.append(word)
                break
        else:
            lines.append([word])
    for line in lines:
        line.sort(key=lambda item: item["x0"])
    lines.sort(key=lambda items: (items[0]["doctop"], items[0]["x0"]))
    return lines


def text_from_words(words: list[dict], x0: float = 0, x1: float = 999) -> str:
    return " ".join(w["text"] for w in words if x0 <= w["x0"] < x1).strip()


def parse_statement(path: Path) -> tuple[dict, list[tuple[str, str, Decimal, str]]]:
    parsed: list[tuple[str, str, Decimal, str]] = []
    with pdfplumber.open(path) as pdf:
        full_text = "\n".join(page.extract_text(x_tolerance=2, y_tolerance=3) or "" for page in pdf.pages)
        account_no_m = ACCOUNT_RE.search(full_text)
        period_m = PERIOD_RE.search(full_text)
        deposits_m = SUMMARY_DEPOSITS_RE.search(full_text)
        withdrawals_m = SUMMARY_WITHDRAWALS_RE.search(full_text)
        if not account_no_m or not period_m or not deposits_m or not withdrawals_m:
            raise RuntimeError(f"Could not read statement summary for {path.name}")

        account_no = re.sub(r"\s+", "", account_no_m.group(1))
        month_end = period_m.group(1)
        current: tuple[str, str, Decimal, str] | None = None

        for page in pdf.pages:
            in_history = False
            for words in line_words(page):
                line_text = text_from_words(words)
                if line_text.lower().startswith("transaction history"):
                    in_history = True
                    continue
                if not in_history:
                    continue
                if (
                    line_text.startswith("Monthly service fee summary")
                    or line_text.startswith("Account transaction fees summary")
                    or line_text.startswith("Totals ")
                    or line_text == "Totals"
                    or line_text.startswith("The Ending Daily Balance")
                    or line_text.startswith("< Business to Business ACH")
                    or line_text.startswith("Ending balance on")
                ):
                    if current:
                        parsed.append(current)
                        current = None
                    in_history = False
                    continue

                first = words[0]["text"] if words else ""
                if DATE_RE.match(first) and 55 <= words[0]["x0"] <= 70:
                    if current:
                        parsed.append(current)
                        current = None

                    credit_tokens = [w for w in words if 390 <= w["x0"] < 452 and MONEY_RE.match(w["text"])]
                    debit_tokens = [w for w in words if 452 <= w["x0"] < 515 and MONEY_RE.match(w["text"])]
                    desc = text_from_words(words, 145, 390)
                    if credit_tokens:
                        current = (first, "credit", money(credit_tokens[-1]["text"]), desc)
                    elif debit_tokens:
                        current = (first, "debit", money(debit_tokens[-1]["text"]), desc)
                    continue

                if current and words and words[0]["x0"] >= 140:
                    extra = text_from_words(words, 145, 390)
                    if extra:
                        current = (current[0], current[1], current[2], f"{current[3]}\n{extra}".strip())

            if current:
                parsed.append(current)
                current = None

    meta = {
        "source_file": path.name,
        "account_number": account_no,
        "account": account_from_name(path, account_no),
        "month_end": month_end,
        "year": statement_year_from_name(path, month_end),
        "stated_deposits": money(deposits_m.group(1)),
        "stated_withdrawals": money(withdrawals_m.group(1)),
    }
    return meta, parsed


def classify_credit(descriptor: str) -> tuple[str, str, str, str, str, str]:
    d = descriptor
    dl = re.sub(r"\s+", " ", d.lower())

    if "interest payment" in dl or dl.startswith("interest"):
        return "Wells Fargo", "excluded_inflow", "INTEREST", "Interest", "high", "Not revenue."
    if "purchase return" in dl or "refund" in dl or "payment reversal" in dl:
        return "Refund/reversal received", "excluded_inflow", "REFUND RECEIVED", "Refund/reversal received", "high", "Excluded from income."
    if "monthly service fee reversal" in dl or "provisional credit" in dl or "ach claim#" in dl:
        return "Bank fee/claim credit", "excluded_inflow", "REFUND RECEIVED", "Bank fee/claim credit", "high", "Excluded from income."
    if "acctverify" in dl or "acct verify" in dl:
        return "Account verification", "excluded_inflow", "OTHER NON-REVENUE", "Account verification", "high", "Nominal verification credit."
    if "parafin capital" in dl:
        return "Parafin Capital", "excluded_inflow", "FINANCING ADVANCE", "Parafin Capital", "high", "Financing advance, not revenue."
    if "shopify capital" in dl:
        return "Shopify Capital", "excluded_inflow", "FINANCING ADVANCE", "Shopify Capital", "high", "Financing advance, not revenue."
    if "online transfer from cyberbrands" in dl or "recurring transfer from cyberbrands" in dl:
        return "Cyberbrands, LLC", "excluded_inflow", "INTERCOMPANY TRANSFER IN", "Cyberbrands, LLC", "high", "Intercompany transfer."
    if "online transfer from sgm" in dl or "online transfer from social gear media" in dl:
        return "SGM / Social Gear Media LLC", "excluded_inflow", "INTERCOMPANY TRANSFER IN", "SGM / Social Gear Media LLC", "high", "Intercompany transfer."
    if "online transfer from splt" in dl:
        return "SPLT INC", "excluded_inflow", "INTERCOMPANY TRANSFER IN", "SPLT INC", "high", "Intercompany transfer."
    if "online transfer from nwosu" in dl or "zelle from nwosu" in dl or "from nwosu" in dl:
        return "Nwosu", "excluded_inflow", "OWNER LOAN / CONTRIBUTION", "Owner/related party", "medium", "Owner or related-party funding."
    if "/org=arize nwosu" in dl or "org=arize nwosu" in dl:
        return "Arize Nwosu", "excluded_inflow", "OWNER LOAN / CONTRIBUTION", "Arize Nwosu", "high", "Owner funding."
    if "/org=chukwuezugo nwosu" in dl or "org=chukwuezugo nwosu" in dl:
        return "Chukwuezugo Nwosu", "excluded_inflow", "OWNER LOAN / CONTRIBUTION", "Chukwuezugo Nwosu", "medium", "Related-party funding; excluded from income."
    if "online transfer from royceton" in dl:
        if "mgmt services" in dl or "management services" in dl:
            return "Royceton", "income", "CONSULTING - Royceton", "Management services", "high", "Descriptor states management services."
        return "Royceton", "excluded_inflow", "OWNER LOAN / CONTRIBUTION", "Royceton", "medium", "Related-party transfer; excluded from income."

    if "amazon" in dl or "amzn" in dl or "dlocal llp payment" in dl:
        return "Amazon", "income", "AMAZON", "Platform cash received", "high", "Cash received, not GMV."
    if "tiktok" in dl or "tik tok" in dl or "bytedance" in dl:
        return "TikTok", "income", "TIKTOK", "Platform cash received", "high", "Cash received, not GMV."
    if any(x in dl for x in ["shopify", "shoppayinst", "afrm payments", "affirm", "klarna", "paypal", "global - e", "global-e", "global e"]):
        return "Shopify / Shop Pay / BNPL", "income", "SHOPIFY", "Platform cash received", "high", "Cash received, not GMV."
    if "walmart" in dl or "wal-mart" in dl:
        return "Walmart", "income", "WALMART", "Platform cash received", "high", "Cash received, not GMV."
    if "best buy" in dl or "bestbuy" in dl:
        return "Best Buy", "income", "BEST BUY", "Platform cash received", "high", "Cash received, not GMV."
    if "kickstarter" in dl or "kickstarte" in dl:
        return "Kickstarter", "income", "KICKSTARTER", "Crowdfunding proceeds", "high", "Cash received."
    if "knocking" in dl or "cbsd" in dl:
        return "Knocking", "income", "KNOCKING", "B2B customer", "high", "Cash received."
    if "ebay" in dl:
        return "eBay", "income", "EBAY", "Marketplace cash received", "high", "Cash received."
    if "lucky rubber ducky" in dl:
        return "Lucky Rubber Ducky, LLC", "income", "WHOLESALE-B2B - Lucky Rubber Ducky, LLC", "B2B customer", "high", "Cash received."
    if "von maur" in dl:
        return "Von Maur Center", "income", "WHOLESALE-B2B - Von Maur Center", "B2B customer", "high", "Cash received."
    if "uncommongoods" in dl:
        return "UncommonGoods LLC", "income", "WHOLESALE-B2B - UncommonGoods LLC", "B2B customer", "high", "Cash received."
    if "localnow, llc" in dl:
        return "Localnow, LLC", "income", "OTHER - Localnow, LLC", "Other cash receipt", "medium", "Business counterparty; revenue nature not identifiable from bank."
    if "teslarati" in dl:
        return "Teslarati", "income", "WHOLESALE-B2B - Teslarati", "B2B customer", "medium", "Business counterparty; product/service nature not identifiable from bank."
    if "shaed, inc" in dl:
        return "Shaed, Inc.", "income", "WHOLESALE-B2B - Shaed, Inc.", "B2B customer", "medium", "Business counterparty; product/service nature not identifiable from bank."

    payer, country = extract_wire_payer_country(d)
    if is_wire_like(dl):
        if payer:
            return payer, "income", f"WHOLESALE-B2B - {payer}", f"Wire receipt {country}".strip(), "medium", "Payer read from /Org= or wire fields."
        return "UNIDENTIFIED", "excluded_inflow", "⚠️ UNIDENTIFIED CREDITS", "Unidentified wire", "low", "No customer identified from descriptor."

    if branch_or_mobile_deposit(dl):
        return "UNIDENTIFIED", "excluded_inflow", "⚠️ UNIDENTIFIED CREDITS", "Branch/mobile deposit", "high", "Statement gives no payer ID."

    business = extract_business_counterparty(d)
    if business:
        return business, "income", f"WHOLESALE-B2B - {business}", "Business counterparty", "medium", "Business counterparty; product/service nature not identifiable from bank."

    return "UNIDENTIFIED", "excluded_inflow", "⚠️ UNIDENTIFIED CREDITS", "Unidentified credit", "low", "Not enough information in descriptor."


def classify_debit(descriptor: str) -> tuple[str, str, str, str, str, str]:
    d = descriptor
    dl = re.sub(r"\s+", " ", d.lower())

    if any(x in dl for x in ["monthly service fee", "wire trans svc charge", "overdraft", "bank fee"]):
        return "Bank", "expense", "BANK FEES", "Bank fees", "high", "Bank fee descriptor."
    if "cyberbackpack" in dl or "cyberbrands" in dl:
        return "Cyberbackpack/Cyberbrands", "excluded_outflow", "CYBERBACKPACK / CYBERBRANDS - SEPARATE", "Separate product line", "high", "Kept separate from Splitflask P&L."
    if any(x in dl for x in ["online transfer to nwosu", "zelle to benefield", "zelle to nwosu", "venmo payment", "everyday checking"]):
        return "Owner/personal", "excluded_outflow", "OWNER DRAW / PERSONAL", "Owner/personal transfer", "medium", "Excluded from expenses."
    if "chukwuezugo nwosu" in dl:
        return "Chukwuezugo Nwosu", "excluded_outflow", "OWNER DRAW / PERSONAL", "Related-party transfer", "medium", "Excluded from expenses; no expense purpose in descriptor."
    if "withdrawal made in a branch" in dl or "atm withdrawal" in dl:
        return "Cash withdrawal", "excluded_outflow", "OWNER DRAW / PERSONAL", "Cash withdrawal", "low", "No vendor or business purpose in bank descriptor."
    if "royceton" in dl and ("online transfer" in dl or "recurring transfer" in dl):
        return "Royceton", "excluded_outflow", "OWNER DRAW / PERSONAL", "Related-party transfer", "medium", "Excluded from expenses."
    if any(
        x in dl
        for x in [
            "online transfer ref",
            "active cash",
            "visa card",
            "chase credit crd epay",
            "chase credit crd retry",
            "chase credit crd autopay",
            "american express ach pmt",
            "american express retry pymt",
            "cc payment",
        ]
    ):
        return "Credit card payment", "excluded_outflow", "CARD PAYMENTS - DETAIL OFF BANK", "Credit card payment", "medium", "Bank cannot identify card-level expense detail."
    if "online transfer to cyberbrands" in dl or "online transfer to splt" in dl or "online transfer to sgm" in dl:
        return "Intercompany", "excluded_outflow", "INTERCOMPANY TRANSFERS OUT", "Intercompany transfer", "high", "Excluded from expenses."
    if "shopify capital" in dl or "parafin capital" in dl:
        return "Shopify Capital", "excluded_outflow", "FINANCING / PRINCIPAL REPAID", "Debt service principal/fees not split", "low", "Statement does not split principal and interest."
    if "sba eidl loan payment" in dl or "santander" in dl or "tesla finance" in dl:
        return "Debt service", "excluded_outflow", "FINANCING / PRINCIPAL REPAID", "Debt service principal/interest not split", "low", "Statement does not split principal and interest; not expensed."

    if "online transfer to social gear media" in dl or "online transfer to splt" in dl or "online transfer to sgm" in dl:
        return "Intercompany", "excluded_outflow", "INTERCOMPANY TRANSFERS OUT", "Intercompany transfer", "high", "Excluded from expenses."

    if any(x in dl for x in ["kangdao", "dongguan", "tuowei baina", "alibaba", "shenzhen", "guangzhou"]):
        return "Factory / inventory vendor", "expense", "COGS / INVENTORY", "Factory/product inventory", "high", "Inventory/factory descriptor."
    if any(x in dl for x in ["dhl", "fedex", "ups", "usps", "pirate ship", "postage", "veeqo", "stamps.com", "shipstation", "uline *ship suppl"]):
        return "Fulfillment/shipping vendor", "expense", "FULFILLMENT & SHIPPING", "Shipping/fulfillment", "high", "Shipping/fulfillment descriptor."
    if any(x in dl for x in ["facebk", "facebook", "fb.me/ads", "tiktok ads", "snap", "google *ads", "google ads", "pr nicole", "pr services", "splitflask pr", "creator samples"]):
        return "Advertising platform", "expense", "ADVERTISING", "Paid media", "high", "Advertising descriptor."
    if any(
        x in dl
        for x in [
            "klaviyo",
            "shopify*",
            "intuit",
            "quickbooks",
            "adobe",
            "google *gsuite",
            "google *cloud",
            "google *google one",
            "gsuite",
            "openai",
            "canva",
            "ionos",
            "railway",
            "jungle scout",
            "mercury commerce",
            "emotive.io",
            "retention harbor",
            "repurpose.io",
            "twilio",
            "dmverify",
            "suno inc.",
            "bolt (by stackbl",
        ]
    ):
        return "Software/SaaS vendor", "expense", "SOFTWARE / SAAS", "Software/SaaS", "high", "Software/SaaS descriptor."
    if any(x in dl for x in ["warehouse rent", "rent", "della moda", "moda della"]):
        return "Rent/warehouse", "expense", "RENT / WAREHOUSE", "Rent/warehouse", "medium", "Rent/warehouse descriptor."
    if any(x in dl for x in ["legal", "law", "attorney", "patent", "uspto", "cpa", "tax", "q tax", "ftb", "trademark counsels", "ca secretary of st"]):
        return "Professional/tax vendor", "expense", "PROFESSIONAL FEES", "Professional/tax/legal", "medium", "Professional/tax descriptor."
    if any(x in dl for x in ["insurance", "next insur", "agi*lowes protect"]):
        return "Insurance", "expense", "INSURANCE", "Insurance", "high", "Insurance descriptor."
    if any(
        x in dl
        for x in [
            "payroll",
            "contractor",
            "creator bonus",
            "reyes amanda",
            "splitflask creator",
            "sales commission",
            "splitflask commission",
            "event services",
            "fiverr",
        ]
    ):
        return "Payroll/contractor", "expense", "PAYROLL / CONTRACTORS", "Payroll/contractor", "medium", "Payroll/contractor descriptor."
    if any(x in dl for x in ["shopify splitfla transfer", "shoppayinst afrm payments", "affirm inc payments"]) and "business to business ach debit" in dl:
        return "Shopify / Shop Pay / BNPL", "expense", "PLATFORM & PROCESSING FEES", "Platform debit/reversal", "high", "Separate bank debit; not inferred from deposits."
    if any(
        x in dl
        for x in [
            "ebay commerce",
            "amazon payment",
            "shopify xxxxxxxxxx",
            "commerce technol",
            "corp e-check",
            "square inc",
            "gs1 us",
            "sps commerce",
            "suppliergateway",
        ]
    ) and ("purchase authorized" in dl or "recurring payment" in dl or "ach debit" in dl or "shopify xxxxxxxxxx" in dl or "commerce technol" in dl):
        return "Marketplace/vendor", "expense", "PLATFORM & PROCESSING FEES", "Marketplace/vendor fee", "medium", "Separate bank debit; not inferred from deposits."
    if "international housewares" in dl or "international hous" in dl or "housewares associatio" in dl:
        return "Trade show / industry event", "expense", "ADVERTISING", "Trade show / market development", "medium", "Industry event descriptor."
    if any(x in dl for x in ["staples", "harvard business s"]):
        return "Office/business supplies", "expense", "SOFTWARE / SAAS", "Office/business services", "medium", "Business/office service descriptor."

    if any(x in dl for x in ["costco", "vons", "sprouts", "target", "mcdonald", "taco bell", "in-n-out", "ikea", "home depot", "apple.com/bill", "tmobile", "tesla service", "tesla reservation", "portugal flight", "portugal payment"]):
        return "Possibly personal/office", "excluded_outflow", "OWNER DRAW / PERSONAL", "Personal/unclear card purchase", "low", "Conservative exclusion from expenses unless business purpose is documented."

    return "UNCLASSIFIED", "unclassified_debit", "⚠️ UNCLASSIFIED DEBITS", "Unclassified debit", "low", "Not enough information in descriptor."


def is_wire_like(dl: str) -> bool:
    markers = ["wt ", "fed#", "/org=", " org=", " bnf=", "/bnf=", " obi=", "/obi=", " srf#", " trn#", " rfb#"]
    return any(marker in dl for marker in markers)


def branch_or_mobile_deposit(dl: str) -> bool:
    return any(x in dl for x in ["deposit made in a branch", "edeposit in branch", "mobile deposit", "atm check deposit", "counter credit"])


def extract_wire_payer_country(descriptor: str) -> tuple[str, str]:
    patterns = [
        r"/Org=([^/]+?)(?:\s+(?:Srf#|Trn#|Rfb#|Org Addr=|Addr=)|$)",
        r"\bOrg=([^/]+?)(?:\s+(?:Srf#|Trn#|Rfb#|Org Addr=|Addr=)|$)",
        r"\bOBI=([^/]+?)(?:\s+(?:Srf#|Trn#|Rfb#)|$)",
        r"\bBNF=([^/]+?)(?:\s+(?:Srf#|Trn#|Rfb#)|$)",
        r"/Bnf=([^/]+?)(?:\s+(?:Srf#|Trn#|Rfb#)|$)",
    ]
    for pat in patterns:
        match = re.search(pat, descriptor, re.IGNORECASE)
        if match:
            payer = clean_payer(match.group(1))
            return payer, infer_country(payer, descriptor)
    return "", infer_country("", descriptor)


def clean_payer(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip(" -")
    return re.sub(r"\b(?:Srf|Trn|Rfb)#.*$", "", value).strip(" -")


def infer_country(payer: str, descriptor: str) -> str:
    text = f"{payer} {descriptor}".lower()
    country_hits = [
        ("singapore", "Singapore"),
        ("pte", "Singapore"),
        ("canada", "Canada"),
        ("royal bank of ca", "Canada"),
        ("hsbc bank canada", "Canada"),
        ("yuanta commercial", "Taiwan"),
        ("cathay united", "Taiwan"),
        ("chiba bank", "Japan"),
        ("national austral", "Australia"),
        ("al-muzaini", "Kuwait"),
        ("national bank of k", "Kuwait"),
    ]
    for needle, country in country_hits:
        if needle in text:
            return country
    return ""


def extract_business_counterparty(descriptor: str) -> str:
    d = descriptor.strip()
    dl = d.lower()
    if any(x in dl for x in ["deposit made", "edeposit", "mobile deposit", "atm check", "facebook", "stripe", "global - e"]):
        return ""
    patterns = [
        r"^([^/]+?)\s+Ppd\s+",
        r"^([^/]+?)\s+Ccd\s+",
        r"^([^/]+?)\s+Ach\s+",
        r"^([^/]+?)\s+Bill[_ ]Pay\s+",
        r"^([^/]+?)\s+Payment\s+",
    ]
    for pat in patterns:
        match = re.search(pat, d, re.IGNORECASE)
        if match:
            return clean_payer(match.group(1))
    return ""


def build() -> tuple[list[Txn], list[dict]]:
    txns: list[Txn] = []
    footing: list[dict] = []
    for path in pdf_files():
        meta, parsed = parse_statement(path)
        credits_total = sum((amount for _, side, amount, _ in parsed if side == "credit"), Decimal("0.00"))
        debits_total = sum((amount for _, side, amount, _ in parsed if side == "debit"), Decimal("0.00"))
        footing.append(
            {
                **meta,
                "parsed_deposits": credits_total,
                "parsed_withdrawals": debits_total,
                "deposit_gap": meta["stated_deposits"] - credits_total,
                "withdrawal_gap": meta["stated_withdrawals"] - debits_total,
                "credit_count": sum(1 for _, side, _, _ in parsed if side == "credit"),
                "debit_count": sum(1 for _, side, _, _ in parsed if side == "debit"),
            }
        )

        for date, side, amount, descriptor in parsed:
            if side == "credit":
                counterparty, section, category, subcategory, confidence, note = classify_credit(descriptor)
            else:
                counterparty, section, category, subcategory, confidence, note = classify_debit(descriptor)
            txns.append(
                Txn(
                    source_file=meta["source_file"],
                    account=meta["account"],
                    account_number=meta["account_number"],
                    year=meta["year"],
                    month_end=meta["month_end"],
                    date=date,
                    side=side,
                    amount=amount,
                    descriptor=descriptor,
                    counterparty=counterparty,
                    pnl_section=section,
                    category=category,
                    subcategory=subcategory,
                    confidence=confidence,
                    note=note,
                )
            )
    return txns, footing


def write_csvs(txns: list[Txn], footing: list[dict]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUT_DIR / "transaction_ledger_bank_pnl.csv").open("w", newline="") as f:
        fields = [
            "account",
            "account_number",
            "year",
            "month_end",
            "date",
            "side",
            "amount",
            "counterparty",
            "pnl_section",
            "category",
            "subcategory",
            "confidence",
            "note",
            "descriptor",
            "source_file",
        ]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for txn in txns:
            row = txn.__dict__.copy()
            row["amount"] = fmt_money(txn.amount)
            writer.writerow(row)

    with (OUT_DIR / "statement_footing_both_sides.csv").open("w", newline="") as f:
        fields = [
            "account",
            "account_number",
            "year",
            "month_end",
            "source_file",
            "stated_deposits",
            "parsed_deposits",
            "deposit_gap",
            "credit_count",
            "stated_withdrawals",
            "parsed_withdrawals",
            "withdrawal_gap",
            "debit_count",
        ]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in footing:
            out = row.copy()
            for key in ["stated_deposits", "parsed_deposits", "deposit_gap", "stated_withdrawals", "parsed_withdrawals", "withdrawal_gap"]:
                out[key] = fmt_money(out[key])
            writer.writerow(out)


def write_report(txns: list[Txn], footing: list[dict]) -> None:
    lines: list[str] = []
    failed = [r for r in footing if r["deposit_gap"] != Decimal("0.00") or r["withdrawal_gap"] != Decimal("0.00")]
    failed_abs = sum((abs(r["deposit_gap"]) + abs(r["withdrawal_gap"]) for r in failed), Decimal("0.00"))

    lines.append("# Cash-Basis P&L From Bank Records Only")
    lines.append("")
    lines.append("Source: Wells Fargo statement PDFs only. This is cash received and cash paid, not GMV.")
    lines.append("")
    lines.append("Limitation: card-paid expenses are not visible at the vendor level in these bank statements. Payments to Chase/Amex/other cards are excluded from expenses because the bank line does not identify the underlying vendor. Therefore this bank-only P&L understates real expenses and overstates profit. The scoped bank records show card-payment outflows, but they do not prove how much was deductible business spend versus personal/other spend.")
    lines.append("")
    lines.append("Platform-fee limitation: Amazon/TikTok and some Shopify processing fees are generally netted from platform deposits. They are not booked as separate bank debits unless a separate bank debit appears. No platform fees were derived as a residual.")
    lines.append("")
    lines.append(f"Statements parsed: {len(footing)}")
    lines.append(f"Statements failed to foot on either side: {len(failed)}")
    lines.append(f"Total absolute footing gap: ${fmt_money(failed_abs)}")
    lines.append("")

    lines.append("## Statement Footing")
    lines.append("| Entity-year | Failed statements | Deposit gap | Withdrawal gap |")
    lines.append("|---|---:|---:|---:|")
    foot_by = defaultdict(lambda: [0, Decimal("0.00"), Decimal("0.00")])
    for r in footing:
        key = (r["account"], r["year"])
        if r["deposit_gap"] or r["withdrawal_gap"]:
            foot_by[key][0] += 1
        foot_by[key][1] += r["deposit_gap"]
        foot_by[key][2] += r["withdrawal_gap"]
    for key in sorted({(r["account"], r["year"]) for r in footing}):
        failed_count, dep_gap, wd_gap = foot_by[key]
        lines.append(f"| {key[0]} {key[1]} | {failed_count} | ${fmt_money(dep_gap)} | ${fmt_money(wd_gap)} |")
    lines.append("")

    groups = defaultdict(list)
    for txn in txns:
        groups[(txn.account, txn.year)].append(txn)

    filed = {("SGM", 2024): Decimal("418990.00"), ("SGM", 2025): Decimal("130976.00"), ("SPLT INC", 2025): Decimal("369981.00")}
    comparison = []

    for key in sorted(groups):
        account, year = key
        subset = groups[key]
        lines.append(f"## {account} {year} P&L")
        lines.append("")
        income_totals = totals_by_category(subset, "income", "credit")
        expense_totals = totals_by_category(subset, "expense", "debit")
        revenue = sum(income_totals.values(), Decimal("0.00"))
        expenses = sum(expense_totals.values(), Decimal("0.00"))
        net = revenue - expenses
        comparison.append((account, year, filed.get(key), revenue))

        lines.append("### Income (cash received)")
        write_amount_table(lines, income_totals)
        lines.append(f"**TOTAL REVENUE:** ${fmt_money(revenue)}")
        lines.append("")

        lines.append("### Expenses (cash paid)")
        write_amount_table(lines, expense_totals)
        lines.append(f"**TOTAL EXPENSES:** ${fmt_money(expenses)}")
        lines.append("")
        lines.append(f"**NET CASH INCOME (bank-basis):** ${fmt_money(net)}")
        lines.append("")

        lines.append("### Memo - excluded / not P&L")
        memo_totals = totals_excluded(subset)
        write_amount_table(lines, memo_totals)
        card_payments = sum((t.amount for t in subset if t.side == "debit" and t.category == "CARD PAYMENTS - DETAIL OFF BANK"), Decimal("0.00"))
        if card_payments:
            lines.append(f"Card-payment outflows with no vendor detail in bank: ${fmt_money(card_payments)}. This is the maximum bank-visible amount that could include off-bank business expenses, but the deductible portion cannot be proven from these statements alone.")
        lines.append("")

        lines.append("### Unidentified credits")
        write_txn_table(lines, [t for t in subset if t.category == "⚠️ UNIDENTIFIED CREDITS"])
        lines.append("")
        lines.append("### Unclassified debits")
        write_txn_table(lines, [t for t in subset if t.category == "⚠️ UNCLASSIFIED DEBITS"])
        lines.append("")

    lines.append("## Filed vs Bank-Basis Revenue")
    lines.append("| Entity-Year | Filed gross receipts | Bank-basis revenue | Variance | Explanation |")
    lines.append("|---|---:|---:|---:|---|")
    for account, year, filed_amount, revenue in comparison:
        if filed_amount is None:
            continue
        variance = revenue - filed_amount
        explanation = variance_explanation(account, year, filed_amount, revenue, groups[(account, year)])
        lines.append(f"| {account} {year} | ${fmt_money(filed_amount)} | ${fmt_money(revenue)} | ${fmt_money(variance)} | {explanation} |")
    lines.append("")

    (OUT_DIR / "cash_basis_pnl_bank_only.md").write_text("\n".join(lines) + "\n")


def totals_by_category(txns: list[Txn], section: str, side: str) -> dict[str, Decimal]:
    totals = defaultdict(lambda: Decimal("0.00"))
    for txn in txns:
        if txn.pnl_section == section and txn.side == side:
            totals[txn.category] += txn.amount
    return dict(sorted(totals.items()))


def totals_excluded(txns: list[Txn]) -> dict[str, Decimal]:
    totals = defaultdict(lambda: Decimal("0.00"))
    for txn in txns:
        if txn.pnl_section in {"excluded_inflow", "excluded_outflow", "unclassified_debit"}:
            totals[txn.category] += txn.amount
    return dict(sorted(totals.items()))


def write_amount_table(lines: list[str], totals: dict[str, Decimal]) -> None:
    if not totals:
        lines.append("_None._")
        return
    lines.append("| Line | Amount |")
    lines.append("|---|---:|")
    for category, amount in totals.items():
        lines.append(f"| {esc(category)} | ${fmt_money(amount)} |")


def write_txn_table(lines: list[str], rows: list[Txn]) -> None:
    if not rows:
        lines.append("_None._")
        return
    total = sum((t.amount for t in rows), Decimal("0.00"))
    lines.append(f"Total: ${fmt_money(total)}")
    lines.append("| Date | Amount | Counterparty | Category | Full descriptor | Source |")
    lines.append("|---|---:|---|---|---|---|")
    for txn in sorted(rows, key=lambda t: (month_end_key(t.month_end), month_day_key(t.date), t.amount, t.descriptor)):
        lines.append(
            f"| {txn.date}/{txn.year} | ${fmt_money(txn.amount)} | {esc(txn.counterparty)} | {esc(txn.category)} | "
            f"{esc(txn.descriptor)} | {esc(txn.source_file)} |"
        )


def variance_explanation(account: str, year: int, filed_amount: Decimal, revenue: Decimal, txns: list[Txn]) -> str:
    excluded_in = sum((t.amount for t in txns if t.pnl_section == "excluded_inflow"), Decimal("0.00"))
    unidentified = sum((t.amount for t in txns if t.category == "⚠️ UNIDENTIFIED CREDITS"), Decimal("0.00"))
    total_credits = sum((t.amount for t in txns if t.side == "credit"), Decimal("0.00"))
    if revenue < filed_amount:
        rounded_total_gap = total_credits - filed_amount
        return (
            "Filed amount is close to total bank deposits rather than bank-basis revenue. "
            f"Total bank credits were ${fmt_money(total_credits)}; excluded/non-revenue credits were ${fmt_money(excluded_in)}, including unidentified credits of ${fmt_money(unidentified)}. "
            f"Total-credits less filed amount = ${fmt_money(rounded_total_gap)}."
        )
    if revenue > filed_amount:
        return (
            "Source-record contradiction to the expected direction: bank-visible customer/platform/B2B receipts classified as income exceed filed gross receipts. "
            f"Total bank credits were ${fmt_money(total_credits)}; excluded/non-revenue credits separately total ${fmt_money(excluded_in)}, including unidentified credits of ${fmt_money(unidentified)}. "
            "This variance is not caused by including owner loans/transfers in bank revenue."
        )
    return f"Rounds to filed amount; excluded/non-revenue credits separately total ${fmt_money(excluded_in)}."


def esc(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", "<br>")


def month_day_key(value: str) -> tuple[int, int]:
    month, day = value.split("/")
    return int(month), int(day)


def month_end_key(value: str) -> datetime:
    return datetime.strptime(value, "%B %d, %Y")


def main() -> None:
    txns, footing = build()
    write_csvs(txns, footing)
    write_report(txns, footing)
    failed = [r for r in footing if r["deposit_gap"] != Decimal("0.00") or r["withdrawal_gap"] != Decimal("0.00")]
    print(f"transactions={len(txns)} statements={len(footing)} failed_footing={len(failed)}")
    for row in failed:
        print(
            f"FAIL {row['source_file']}: deposit_gap={fmt_money(row['deposit_gap'])} "
            f"withdrawal_gap={fmt_money(row['withdrawal_gap'])}"
        )


if __name__ == "__main__":
    main()
