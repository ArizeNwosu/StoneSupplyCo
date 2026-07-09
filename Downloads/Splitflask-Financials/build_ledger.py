#!/usr/bin/env python3
"""
Build ledger.xlsx for the Splitflask DD reconstruction project.
Run once during setup. Safe to re-run (overwrites).
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from datetime import date

TODAY = date.today().isoformat()  # 2026-07-09

wb = openpyxl.Workbook()

# ── helpers ──────────────────────────────────────────────────────────────────

HEADER_FONT  = Font(bold=True)
HEADER_FILL  = PatternFill("solid", fgColor="D9D9D9")

def make_tab(wb, name, headers, *, freeze="A2"):
    ws = wb.create_sheet(name)
    ws.append(headers)
    # style header row
    for cell in ws[1]:
        cell.font   = HEADER_FONT
        cell.fill   = HEADER_FILL
        cell.alignment = Alignment(horizontal="center")
    ws.freeze_panes = freeze
    # auto-width (rough)
    for i, h in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(i)].width = max(len(h) + 4, 14)
    return ws

# ── Tab 1: Figures ────────────────────────────────────────────────────────────

figures_headers = [
    "key", "label", "value", "entity", "period",
    "basis", "status", "source_id", "source_ref", "version", "updated", "notes"
]
make_tab(wb, "Figures", figures_headers)

# ── Tab 2: Sources ────────────────────────────────────────────────────────────

sources_headers = [
    "source_id", "doc_name", "type", "entity", "local_path", "status", "notes"
]
ws_sources = make_tab(wb, "Sources", sources_headers)

# Each row: (source_id, doc_name, type, entity, local_path, status, notes)
# status: staged = file present | missing = expected but absent

source_rows = [
    # ── SETUP / PROMPT ─────────────────────────────────────────────────────────
    ("S000", "SETUP_THREAD_PROMPT.md",          "other",      "all",          "SETUP_THREAD_PROMPT.md",                                               "staged", "Layer-0 setup instructions"),

    # ── HANDOFF / SESSION NOTES ────────────────────────────────────────────────
    ("S001", "SPLT_Handoff_Packet_v11_Build.md","packet",     "all",          "SPLT_Handoff_Packet_v11_Build.md",                                     "staged", "v11 AI handoff packet"),
    ("S002", "SPLT_Handoff_Packet_v12_Build.md","packet",     "all",          "SPLT_Handoff_Packet_v12_Build.md",                                     "staged", "v12 AI handoff packet (primary)"),
    ("S003", "SPLT_Handoff_Packet_v12_Build (1).md","packet", "all",          "SPLT_Handoff_Packet_v12_Build (1).md",                                 "staged", "v12 AI handoff packet (duplicate copy)"),
    ("S004", "SPLT_INC_Previous_AI_Full_Chat_Session2.md","other","all",      "SPLT_INC_Previous_AI_Full_Chat_Session2.md",                           "staged", "Prior AI session transcript"),

    # ── V11 INVESTOR WORKBOOK ──────────────────────────────────────────────────
    ("S010", "SPLT_INC_Financial_Reconstruction_v11.xlsx","workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v11.xlsx",                 "staged", "V11 investor workbook — primary input for Layer-2 cascade"),

    # ── PRIOR RECONSTRUCTION VERSIONS (archival) ───────────────────────────────
    ("S011", "SPLT_INC_Financial_Reconstruction_v10.xlsx","workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v10.xlsx",                 "staged", "Prior version"),
    ("S012", "SPLT_INC_Financial_Reconstruction_v9.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v9.xlsx",                  "staged", "Prior version"),
    ("S013", "SPLT_INC_Financial_Reconstruction_v8.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v8.xlsx",                  "staged", "Prior version"),
    ("S014", "SPLT_INC_Financial_Reconstruction_v7.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v7.xlsx",                  "staged", "Prior version"),
    ("S015", "SPLT_INC_Financial_Reconstruction_v6.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v6.xlsx",                  "staged", "Prior version"),
    ("S016", "SPLT_INC_Financial_Reconstruction_v4.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v4.xlsx",                  "staged", "Prior version"),
    ("S017", "SPLT_INC_Financial_Reconstruction_v3.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v3.xlsx",                  "staged", "Prior version"),
    ("S018", "SPLT_INC_Financial_Reconstruction_v2.xlsx", "workbook","all",   "files (1)/SPLT_INC_Financial_Reconstruction_v2.xlsx",                  "staged", "Prior version"),

    # ── CPA PACKETS ────────────────────────────────────────────────────────────
    ("S020", "SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx","packet","SGM","files (1)/SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx",             "staged", "2024 CPA expense reconstruction packet for SGM"),
    ("S021", "SPLT_SGM_2025_Tax_Amendment_Packet.xlsx",  "packet","all",      "files (1)/SPLT_SGM_2025_Tax_Amendment_Packet.xlsx",                    "staged", "2025 CPA tax amendment packet (SPLT + SGM)"),
    ("S022", "CPA_Amendment_Cover_Letter.docx",          "packet","all",      "files (1)/CPA_Amendment_Cover_Letter.docx",                            "staged", "Cover letter for CPA amendment"),
    ("S023", "SGM_2024_1120S_Amendment_Packet_FINAL.xlsx","packet","SGM",     "files (1)/SGM_2024_1120S_Amendment_Packet_FINAL.xlsx",                 "staged", "SGM 2024 1120-S amendment packet (FINAL)"),
    ("S024", "SGM_2024_Amendment_Model.xlsx",            "workbook","SGM",    "files (1)/SGM_2024_Amendment_Model.xlsx",                              "staged", "SGM 2024 amendment model workbook"),

    # ── SGM DEPOSIT CLASSIFICATION SCHEDULES ───────────────────────────────────
    ("S025", "SGM_2024_Deposit_Classification_Schedule_v4.xlsx","workbook","SGM","files (1)/SGM_2024_Deposit_Classification_Schedule_v4.xlsx",        "staged", "Deposit classification schedule v4 (latest)"),
    ("S026", "SGM_2024_Deposit_Classification_Schedule_v3.xlsx","workbook","SGM","files (1)/SGM_2024_Deposit_Classification_Schedule_v3.xlsx",        "staged", "Prior version"),
    ("S027", "SGM_2024_Deposit_Classification_Schedule_v2.xlsx","workbook","SGM","files (1)/SGM_2024_Deposit_Classification_Schedule_v2.xlsx",        "staged", "Prior version"),
    ("S028", "SGM_2024_Deposit_Classification_Schedule.xlsx",   "workbook","SGM","files (1)/SGM_2024_Deposit_Classification_Schedule.xlsx",           "staged", "Prior version"),

    # ── ENTITY ARRANGEMENT MODEL ───────────────────────────────────────────────
    ("S030", "Entity_Arrangement_Model_v2.xlsx",         "workbook","all",    "files (1)/Entity_Arrangement_Model_v2.xlsx",                           "staged", "Entity arrangement model v2"),
    ("S031", "Entity_Arrangement_Model.xlsx",            "workbook","all",    "files (1)/Entity_Arrangement_Model.xlsx",                              "staged", "Entity arrangement model v1"),

    # ── TAX RETURNS ───────────────────────────────────────────────────────────
    ("S040", "SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf","return","SGM", "SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf",                      "staged", "SGM 2024 Form 1120-S (copy 2)"),
    ("S041", "SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (3).pdf","return","SGM", "SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (3).pdf",                      "staged", "SGM 2024 Form 1120-S (copy 3)"),
    ("S042", "SOCIAL GEAR MEDIA LLC 2025 Form 1120-S.pdf",    "return","SGM", "SOCIAL GEAR MEDIA LLC 2025 Form 1120-S.pdf",                          "staged", "SGM 2025 Form 1120-S"),
    ("S043", "SPLIT INC 2025 Form 1120 (2).pdf",              "return","SPLT","SPLIT INC 2025 Form 1120 (2).pdf",                                    "staged", "SPLT Inc 2025 Form 1120 (C-corp)"),
    ("S044", "ARIZECHUKWU NWOSU 2024 Form 1040 (2).pdf",      "return","personal","ARIZECHUKWU NWOSU CHERYL BENEFIELD 2024 Form 1040 (2).pdf",      "staged", "Personal 1040 2024 — Cyberbrands Schedule C included here"),
    ("S045", "ARIZECHUKWU NWOSU 2024 Form 1040 (3).pdf",      "return","personal","ARIZECHUKWU NWOSU CHERYL BENEFIELD 2024 Form 1040 (3).pdf",      "staged", "Personal 1040 2024 (copy 3)"),
    ("S046", "ARIZECHUKWU NWOSU 2024 Form 1040 (4).pdf",      "return","personal","ARIZECHUKWU NWOSU CHERYL BENEFIELD 2024 Form 1040 (4).pdf",      "staged", "Personal 1040 2024 (copy 4)"),
    ("S047", "ARIZECHUKWU NWOSU 2025 Form 1040.pdf",          "return","personal","ARIZECHUKWU NWOSU CHERYL BENEFIELD 2025 Form 1040.pdf",          "staged", "Personal 1040 2025 — confirm Cyberbrands Schedule C included"),
    ("S048", "CA-Sales-and-Use-Tax-Return.pdf",               "return","unknown","CA-Sales-and-Use-Tax-Return.pdf",                                 "staged", "CA Sales and Use Tax return — entity TBD"),
    ("S049", "SPLT Sales Tax.pdf",                            "return","SPLT", "SPLT Sales Tax.pdf",                                                "staged", "SPLT sales tax filing"),

    # ── 1099-K: AMAZON ────────────────────────────────────────────────────────
    ("S050", "2024-1099K.pdf",                                 "1099-K","unknown","2024-1099K.pdf",                                                  "staged", "2024 1099-K primary PDF — entity/platform TBD; may be Amazon SGM or TikTok"),
    ("S051", "2024-1099K (1).pdf",                             "1099-K","unknown","2024-1099K (1).pdf",                                              "staged", "Duplicate copy"),
    ("S052", "2024-1099K (2).pdf",                             "1099-K","unknown","2024-1099K (2).pdf",                                              "staged", "Duplicate copy"),
    ("S053", "Amazon-Cyberbrands-2024-1099K-2.pdf",            "1099-K","Cyberbrands","Amazon-Cyberbrands-2024-1099K-2.pdf",                         "staged", "Amazon 1099-K for Cyberbrands LLC 2024 — routed to Schedule C"),
    ("S054", "2025-1099K.pdf",                                 "1099-K","unknown","2025-1099K.pdf",                                                  "staged", "2025 1099-K — entity/platform TBD"),

    # ── 1099-K: TIKTOK PDF ────────────────────────────────────────────────────
    ("S055", "7495370463474518494B_2024_1099-K (1).pdf",       "1099-K","SPLT", "7495370463474518494B_2024_1099-K (1).pdf",                          "staged", "TikTok 2024 1099-K PDF (account 7495370463474518494)"),

    # ── 1099-K: SHOPIFY ───────────────────────────────────────────────────────
    ("S056", "2024-Shopify-1099K.pdf",                         "1099-K","unknown","2024-Shopify-1099K.pdf",                                          "staged", "Shopify 2024 1099-K — entity (SGM or SPLT) TBD"),
    ("S057", "2025-Shopify-1099K.pdf",                         "1099-K","unknown","2025-Shopify-1099K.pdf",                                          "staged", "Shopify 2025 1099-K — entity TBD"),
    ("S058", "Shopify-SGM-1099-K.pdf",                         "1099-K","SGM",  "Shopify-SGM-1099-K.pdf",                                           "staged", "Shopify 1099-K explicitly labeled SGM"),

    # ── 1099-K: TIKTOK MONTHLY DETAIL CSVs (9 files) ─────────────────────────
    ("S060", "TikTok 1099-K 2024-02 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_2_detail.csv",                       "staged", "TikTok monthly 1099-K detail — Feb 2024"),
    ("S061", "TikTok 1099-K 2024-05 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_5_detail.csv",                       "staged", "May 2024"),
    ("S062", "TikTok 1099-K 2024-06 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_6_detail.csv",                       "staged", "Jun 2024"),
    ("S063", "TikTok 1099-K 2024-07 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_7_detail.csv",                       "staged", "Jul 2024"),
    ("S064", "TikTok 1099-K 2024-08 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_8_detail.csv",                       "staged", "Aug 2024"),
    ("S065", "TikTok 1099-K 2024-09 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_9_detail.csv",                       "staged", "Sep 2024"),
    ("S066", "TikTok 1099-K 2024-10 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_10_detail.csv",                      "staged", "Oct 2024"),
    ("S067", "TikTok 1099-K 2024-11 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_11_detail.csv",                      "staged", "Nov 2024"),
    ("S068", "TikTok 1099-K 2024-12 detail CSV",               "csv",  "SPLT",  "1099k_7495370463474518494_2024_12_detail.csv",                      "staged", "Dec 2024"),

    # ── AMAZON TRANSACTION CSVs ───────────────────────────────────────────────
    ("S070", "AMA 2024Jan1-2024Dec31 Unified Transaction CSV",  "csv","unknown","AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv",                 "staged", "Amazon unified transactions 2024 full year"),
    ("S071", "AMA 2024Jan1-2024Apr23 Unified Transaction CSV",  "csv","unknown","AMA 2024Jan1-2024Apr23CustomUnifiedTransaction.csv",                 "staged", "Amazon unified transactions 2024 partial (Jan–Apr)"),
    ("S072", "AMA 2025Jan1-2025Dec31 Unified Transaction CSV",  "csv","unknown","AMA 2025Jan1-2025Dec31CustomUnifiedTransaction.csv",                 "staged", "Amazon unified transactions 2025 full year"),
    ("S073", "AMA 2026Jan1-2026Jun30 Unified Transaction CSV",  "csv","unknown","AMA 2026Jan1-2026Jun30CustomUnifiedTransaction.csv",                 "staged", "Amazon unified transactions 2026 YTD"),
    ("S074", "AMA 2024 Ad Spend CSV (v1)",                      "csv","unknown","AMA 2024_Ad_Spend.csv",                                             "staged", "Amazon ad spend 2024 (short file; may be subset)"),
    ("S075", "AMA Ad_Spend_2024 CSV",                           "csv","unknown","AMA Ad_Spend_2024.csv",                                             "staged", "Amazon ad spend 2024 (alternate export)"),
    ("S076", "AMA Ad_Spend_2025 CSV",                           "csv","unknown","AMA Ad_Spend_2025.csv",                                             "staged", "Amazon ad spend 2025"),

    # ── SHOPIFY / SALES BREAKDOWN CSVs ────────────────────────────────────────
    ("S080", "Total sales breakdown 2024 CSV",                  "csv","unknown","Total sales breakdown - 2024-01-01 - 2024-12-31.csv",                "staged", "Shopify total sales breakdown 2024"),
    ("S081", "Total sales breakdown 2025 CSV",                  "csv","unknown","Total sales breakdown - 2025-01-01 - 2025-12-31.csv",                "staged", "Shopify total sales breakdown 2025"),
    ("S082", "Total sales breakdown 2026 YTD CSV",              "csv","unknown","Total sales breakdown - 2026-01-01 - 2026-06-30.csv",                "staged", "Shopify total sales breakdown 2026 YTD"),

    # ── SHOPIFY INVOICE SUMMARY PDFs/CSVs ─────────────────────────────────────
    ("S083", "Shopify Invoice Summary 2024 CSV",                "csv","unknown","2024-01-01--2025-01-01_Invoice_Summary.csv",                         "staged", "Shopify invoice summary Jan 2024–Jan 2025"),
    ("S084", "Shopify Invoice Summary 2025 PDF",                "other","unknown","2025-01-01--2026-01-01_Invoice_Summary (1).pdf",                   "staged", "Shopify invoice summary Jan 2025–Jan 2026"),
    ("S085", "Cyberbackpack Shopify Invoice Summary 2025 PDF",  "other","Cyberbrands","Cyberbackpack-Cyberbrands-2025-01-01--2026-01-01_Invoice_Summary.pdf","staged","Cyberbrands/Cyberbackpack Shopify invoice summary 2025"),

    # ── CA TAX CSVs ───────────────────────────────────────────────────────────
    ("S086", "CA Combined Tax 2025 CSV",                        "csv","unknown","2025Jan1-2026Jan1_CustomCombinedTaxCalifornia (1).csv",               "staged", "CA combined tax detail Jan 2025–Jan 2026"),
    ("S087", "CA MPF Tax 2025 CSV",                             "csv","unknown","2025Jan31-2026Jan1_CustomMPFTaxCalifornia (2).csv",                   "staged", "CA MPF tax detail Feb 2025–Jan 2026"),

    # ── FACEBOOK ADS ─────────────────────────────────────────────────────────
    ("S090", "Facebook Ads Splitflask 2024 Invoice CSV",        "csv","SPLT",  "Facebook-Ads-Splitflask-2024-01-01--2025-01-01_Invoice_Summary (1).csv","staged","FB Ads invoice summary Splitflask 2024"),
    ("S091", "Facebook Ads Splitflask 2025 Invoice CSV",        "csv","SPLT",  "Splitflask-Facebook-Ads-2025-01-01--2026-01-01_Invoice_Summary (1).csv","staged","FB Ads invoice summary Splitflask 2025"),
    ("S092", "Cyberbrands FB Ads 2025 Invoice xlsx",            "workbook","Cyberbrands","Cberbackpack-Cyberbrands-Facebook-Ads-2025-01-01--2026-01-01_Invoice_Summary(Non-Splitflask).xlsx","staged","Cyberbrands FB Ads invoice summary 2025 (non-Splitflask)"),

    # ── SALES DASHBOARD CSVs ─────────────────────────────────────────────────
    ("S095", "SalesDashboard 2026-07-07 (primary)",             "csv","SPLT",  "SalesDashboard-07-07-26.csv",                                         "staged", "Sales dashboard export Jul 7 2026"),
    ("S096", "SalesDashboard 2026-07-07 (copy 1)",              "csv","SPLT",  "SalesDashboard-07-07-26 (1).csv",                                     "staged", "Duplicate"),
    ("S097", "SalesDashboard 2026-07-07 (copy 2)",              "csv","SPLT",  "SalesDashboard-07-07-26 (2).csv",                                     "staged", "Duplicate"),
    ("S098", "SalesDashboard 2026-07-06",                       "csv","SPLT",  "SalesDashboard-7-06-26.csv",                                          "staged", "Sales dashboard export Jul 6 2026"),

    # ── MERCHANT STATEMENT P&L ────────────────────────────────────────────────
    ("S100", "merchant_statement_profit_loss_7659948521974482702.xlsx","workbook","unknown","merchant_statement_profit_loss_7659948521974482702.xlsx","staged","Merchant P&L statement (account suffix 2702)"),
    ("S101", "merchant_statement_profit_loss_7659948521974499086.xlsx","workbook","unknown","merchant_statement_profit_loss_7659948521974499086.xlsx","staged","Merchant P&L statement (account suffix 9086)"),

    # ── BANK STATEMENTS: SGM (Wells Fargo acct ending 8625) ───────────────────
    ("S110", "SGM WF Jan 2024",     "bank-stmt","SGM","SGM 013124 WellsFargo (1).pdf",  "staged","SGM WF 8625 Jan 2024"),
    ("S111", "SGM WF Feb 2024",     "bank-stmt","SGM","SGM 022924 WellsFargo (1).pdf",  "staged","SGM WF 8625 Feb 2024"),
    ("S112", "SGM WF Mar 2024",     "bank-stmt","SGM","SGM 033124 WellsFargo (1).pdf",  "staged","SGM WF 8625 Mar 2024"),
    ("S113", "SGM WF Apr 2024",     "bank-stmt","SGM","SGM 043024 WellsFargo (1).pdf",  "staged","SGM WF 8625 Apr 2024"),
    ("S114", "SGM WF May 2024",     "bank-stmt","SGM","SGM 053124 WellsFargo (1).pdf",  "staged","SGM WF 8625 May 2024"),
    ("S115", "SGM WF Jun 2024",     "bank-stmt","SGM","SGM 063024 WellsFargo (1).pdf",  "staged","SGM WF 8625 Jun 2024"),
    ("S116", "SGM WF Jul 2024",     "bank-stmt","SGM","SGM 073124 WellsFargo (1).pdf",  "staged","SGM WF 8625 Jul 2024"),
    ("S117", "SGM WF Aug 2024",     "bank-stmt","SGM","SGM 083124 WellsFargo (2).pdf",  "staged","SGM WF 8625 Aug 2024"),
    ("S118", "SGM WF Sep 2024",     "bank-stmt","SGM","SGM 093024 WellsFargo (3).pdf",  "staged","SGM WF 8625 Sep 2024"),
    ("S119", "SGM WF Oct 2024",     "bank-stmt","SGM","SGM 103124 WellsFargo (2).pdf",  "staged","SGM WF 8625 Oct 2024"),
    ("S120", "SGM WF Nov 2024",     "bank-stmt","SGM","SGM 113024 WellsFargo (3).pdf",  "staged","SGM WF 8625 Nov 2024"),
    ("S121", "SGM WF Dec 2024",     "bank-stmt","SGM","SGM 123124 WellsFargo (4).pdf",  "staged","SGM WF 8625 Dec 2024"),
    ("S122", "SGM WF Jan 2025",     "bank-stmt","SGM","SGM 013125 WellsFargo (2).pdf",  "staged","SGM WF 8625 Jan 2025"),
    ("S123", "SGM WF Feb 2025",     "bank-stmt","SGM","SGM 022825 WellsFargo (1).pdf",  "staged","SGM WF 8625 Feb 2025"),
    ("S124", "SGM WF Mar 2025",     "bank-stmt","SGM","SGM 033125 WellsFargo (1).pdf",  "staged","SGM WF 8625 Mar 2025"),
    ("S125", "SGM WF Apr 2025",     "bank-stmt","SGM","SGM  043025 WellsFargo (2).pdf", "staged","SGM WF 8625 Apr 2025"),
    ("S126", "SGM WF May 2025",     "bank-stmt","SGM","SGM 053125 WellsFargo (1).pdf",  "staged","SGM WF 8625 May 2025"),
    ("S127", "SGM WF Jun 2025",     "bank-stmt","SGM","SGM 063025 WellsFargo (1).pdf",  "staged","SGM WF 8625 Jun 2025"),
    ("S128", "SGM WF Jul 2025",     "bank-stmt","SGM","SGM 073125 WellsFargo (4).pdf",  "staged","SGM WF 8625 Jul 2025"),
    ("S129", "SGM WF Aug 2025",     "bank-stmt","SGM","SGM 083125 WellsFargo (1).pdf",  "staged","SGM WF 8625 Aug 2025"),
    ("S130", "SGM WF Sep 2025",     "bank-stmt","SGM","SGM 093025 WellsFargo (1).pdf",  "staged","SGM WF 8625 Sep 2025"),
    ("S131", "SGM WF Oct 2025",     "bank-stmt","SGM","SGM 103125 WellsFargo (2).pdf",  "staged","SGM WF 8625 Oct 2025"),
    ("S132", "SGM WF Nov 2025",     "bank-stmt","SGM","SGM 113025 WellsFargo (2).pdf",  "staged","SGM WF 8625 Nov 2025"),
    ("S133", "SGM WF Dec 2025",     "bank-stmt","SGM","SGM 123125 WellsFargo (3).pdf",  "staged","SGM WF 8625 Dec 2025"),

    # ── BANK STATEMENTS: CYBERBRANDS (Wells Fargo) ────────────────────────────
    ("S140", "Cyberbrands WF Jan 2024","bank-stmt","Cyberbrands","cyberbrands 013124 WellsFargo (3).pdf","staged","Cyberbrands WF Jan 2024"),
    ("S141", "Cyberbrands WF Feb 2024","bank-stmt","Cyberbrands","cyberbrands 022924 WellsFargo (3).pdf","staged","Cyberbrands WF Feb 2024"),
    ("S142", "Cyberbrands WF Mar 2024","bank-stmt","Cyberbrands","cyberbrands 033124 WellsFargo (3).pdf","staged","Cyberbrands WF Mar 2024"),
    ("S143", "Cyberbrands WF Apr 2024","bank-stmt","Cyberbrands","cyberbrands 043024 WellsFargo (3).pdf","staged","Cyberbrands WF Apr 2024"),
    ("S144", "Cyberbrands WF May 2024","bank-stmt","Cyberbrands","cyberbrands 053124 WellsFargo (3).pdf","staged","Cyberbrands WF May 2024"),
    ("S145", "Cyberbrands WF Jun 2024","bank-stmt","Cyberbrands","cyberbrands 063024 WellsFargo (3).pdf","staged","Cyberbrands WF Jun 2024"),
    ("S146", "Cyberbrands WF Jul 2024","bank-stmt","Cyberbrands","cyberbrands 073124 WellsFargo (3).pdf","staged","Cyberbrands WF Jul 2024"),
    ("S147", "Cyberbrands WF Aug 2024","bank-stmt","Cyberbrands","cyberbrands 083124 WellsFargo (4).pdf","staged","Cyberbrands WF Aug 2024"),
    ("S148", "Cyberbrands WF Sep 2024","bank-stmt","Cyberbrands","cyberbrands 093024 WellsFargo (5).pdf","staged","Cyberbrands WF Sep 2024"),
    ("S149", "Cyberbrands WF Oct 2024","bank-stmt","Cyberbrands","cyberbrands 103124 WellsFargo (4).pdf","staged","Cyberbrands WF Oct 2024"),
    ("S150", "Cyberbrands WF Nov 2024","bank-stmt","Cyberbrands","cyberbrands 113024 WellsFargo (5).pdf","staged","Cyberbrands WF Nov 2024"),
    ("S151", "Cyberbrands WF Dec 2024","bank-stmt","Cyberbrands","cyberbrands WellsFargo (6).pdf",       "staged","Cyberbrands WF Dec 2024 (no date prefix in filename — verify)"),

    # ── BANK STATEMENTS: UNLABELED WELLS FARGO (probable SPLT acct 0423) ──────
    # Date code format: MMDDYY. No entity prefix = likely SPLT WF 0423 (to confirm)
    ("S160", "WF Sep 2023 (unattributed)", "bank-stmt","unknown","093023 WellsFargo.pdf",         "staged","WF Sep 2023 — no entity label; earliest unlabeled stmt. Likely Cyberbrands or SPLT."),
    ("S161", "WF Oct 2023 (unattributed)", "bank-stmt","unknown","103123 WellsFargo.pdf",         "staged","WF Oct 2023 — no entity label"),
    ("S162", "WF Nov 2023 (unattributed)", "bank-stmt","unknown","113023 WellsFargo (1).pdf",     "staged","WF Nov 2023 — no entity label"),
    ("S163", "WF Dec 2023 (unattributed)", "bank-stmt","unknown","123123 WellsFargo.pdf",         "staged","WF Dec 2023 — no entity label"),
    ("S164", "WF Jan 2024 (unattributed)", "bank-stmt","unknown","013124 WellsFargo (2).pdf",     "staged","WF Jan 2024 — index (2) suggests different acct from SGM (1) and Cyberbrands (3); likely SPLT 0423"),
    ("S165", "WF Feb 2024 (unattributed)", "bank-stmt","unknown","022924 WellsFargo (2).pdf",     "staged","WF Feb 2024 — probable SPLT 0423"),
    ("S166", "WF Mar 2024 (unattributed)", "bank-stmt","unknown","033124 WellsFargo (2).pdf",     "staged","WF Mar 2024 — probable SPLT 0423"),
    ("S167", "WF Apr 2024 (unattributed)", "bank-stmt","unknown","043024 WellsFargo (2).pdf",     "staged","WF Apr 2024 — probable SPLT 0423"),
    ("S168", "WF May 2024 (unattributed)", "bank-stmt","unknown","053124 WellsFargo (2).pdf",     "staged","WF May 2024 — probable SPLT 0423"),
    ("S169", "WF Jun 2024 (unattributed)", "bank-stmt","unknown","063024 WellsFargo (2).pdf",     "staged","WF Jun 2024 — probable SPLT 0423"),
    ("S170", "WF Jul 2024 (unattributed)", "bank-stmt","unknown","073124 WellsFargo (2).pdf",     "staged","WF Jul 2024 — probable SPLT 0423"),
    ("S171", "WF Aug 2024 (unattributed)", "bank-stmt","unknown","083124 WellsFargo (3).pdf",     "staged","WF Aug 2024 — probable SPLT 0423"),
    ("S172", "WF Sep 2024 (unattributed)", "bank-stmt","unknown","093024 WellsFargo (4).pdf",     "staged","WF Sep 2024 — probable SPLT 0423; note Kangdao wire month"),
    ("S173", "WF Oct 2024 (unattributed)", "bank-stmt","unknown","103124 WellsFargo (3).pdf",     "staged","WF Oct 2024 — probable SPLT 0423"),
    ("S174", "WF Nov 2024 (unattributed)", "bank-stmt","unknown","113024 WellsFargo (4).pdf",     "staged","WF Nov 2024 — probable SPLT 0423"),
    ("S175", "WF Dec 2024 (unattributed)", "bank-stmt","unknown","123124 WellsFargo (5).pdf",     "staged","WF Dec 2024 — probable SPLT 0423"),
    # 2025 unlabeled
    ("S176", "WF Jan 2025 (unattributed)", "bank-stmt","unknown","013125 WellsFargo (1).pdf",     "staged","WF Jan 2025 — no entity label"),
    ("S177", "WF Jan 2025 B (unattributed)","bank-stmt","unknown","013125 WellsFargo.pdf",        "staged","WF Jan 2025 — second unlabeled Jan 2025 file"),
    ("S178", "WF Feb 2025 (unattributed)", "bank-stmt","unknown","022825 WellsFargo.pdf",         "staged","WF Feb 2025 — no entity label"),
    ("S179", "WF Mar 2025 (unattributed)", "bank-stmt","unknown","033125 WellsFargo.pdf",         "staged","WF Mar 2025 — no entity label"),
    ("S180", "WF Apr 2025 (unattributed)", "bank-stmt","unknown","043025 WellsFargo (1).pdf",     "staged","WF Apr 2025 — no entity label"),
    ("S181", "WF May 2025 (unattributed)", "bank-stmt","unknown","053125 WellsFargo.pdf",         "staged","WF May 2025 — no entity label"),
    ("S182", "WF Jun 2025 (unattributed)", "bank-stmt","unknown","063025 WellsFargo.pdf",         "staged","WF Jun 2025 — no entity label"),
    ("S183", "WF Jul 2025 (unattributed)", "bank-stmt","unknown","073125 WellsFargo (3).pdf",     "staged","WF Jul 2025 — no entity label"),
    ("S184", "WF Aug 2025 (unattributed)", "bank-stmt","unknown","083125 WellsFargo.pdf",         "staged","WF Aug 2025 — no entity label"),
    ("S185", "WF Sep 2025 (unattributed)", "bank-stmt","unknown","093025 WellsFargo.pdf",         "staged","WF Sep 2025 — no entity label"),
    ("S186", "WF Oct 2025 (unattributed)", "bank-stmt","unknown","103125 WellsFargo (1).pdf",     "staged","WF Oct 2025 — no entity label"),
    ("S187", "WF Nov 2025 (unattributed)", "bank-stmt","unknown","113025 WellsFargo (1).pdf",     "staged","WF Nov 2025 — no entity label"),
    ("S188", "WF Dec 2025 (unattributed)", "bank-stmt","unknown","123125 WellsFargo (2).pdf",     "staged","WF Dec 2025 — no entity label"),
    # 2026 unlabeled (6 months — SPLT acct 0423 most likely)
    ("S189", "WF Jan 2026 (unattributed)", "bank-stmt","unknown","013126 WellsFargo.pdf",         "staged","WF Jan 2026 — probable SPLT 0423"),
    ("S190", "WF Jan 2026 B",              "bank-stmt","unknown","013126 WellsFargo (1).pdf",     "staged","WF Jan 2026 alt copy"),
    ("S191", "WF Jan 2026 C",              "bank-stmt","unknown","013126 WellsFargo (2).pdf",     "staged","WF Jan 2026 alt copy"),
    ("S192", "WF Jan 2026 D",              "bank-stmt","unknown","013126 WellsFargo (3).pdf",     "staged","WF Jan 2026 alt copy"),
    ("S193", "WF Feb 2026",               "bank-stmt","unknown","022826 WellsFargo.pdf",          "staged","WF Feb 2026 — probable SPLT 0423"),
    ("S194", "WF Feb 2026 B",              "bank-stmt","unknown","022826 WellsFargo (1).pdf",     "staged","WF Feb 2026 alt copy"),
    ("S195", "WF Feb 2026 C",              "bank-stmt","unknown","022826 WellsFargo (2).pdf",     "staged","WF Feb 2026 alt copy"),
    ("S196", "WF Mar 2026",               "bank-stmt","unknown","033126 WellsFargo (1).pdf",      "staged","WF Mar 2026"),
    ("S197", "WF Mar 2026 B",              "bank-stmt","unknown","033126 WellsFargo (2).pdf",     "staged","WF Mar 2026 alt copy"),
    ("S198", "WF Mar 2026 C",              "bank-stmt","unknown","033126 WellsFargo (3).pdf",     "staged","WF Mar 2026 alt copy"),
    ("S199", "WF Mar 2026 D",              "bank-stmt","unknown","033126 WellsFargo (4).pdf",     "staged","WF Mar 2026 alt copy"),
    ("S200", "WF Apr 2026",               "bank-stmt","unknown","043026 WellsFargo.pdf",          "staged","WF Apr 2026"),
    ("S201", "WF Apr 2026 B",              "bank-stmt","unknown","043026 WellsFargo (1).pdf",     "staged","WF Apr 2026 alt copy"),
    ("S202", "WF Apr 2026 C",              "bank-stmt","unknown","043026 WellsFargo (2).pdf",     "staged","WF Apr 2026 alt copy"),
    ("S203", "WF May 2026",               "bank-stmt","unknown","053126 WellsFargo.pdf",          "staged","WF May 2026"),
    ("S204", "WF May 2026 B",              "bank-stmt","unknown","053126 WellsFargo (1).pdf",     "staged","WF May 2026 alt copy"),
    ("S205", "WF May 2026 C",              "bank-stmt","unknown","053126 WellsFargo (2).pdf",     "staged","WF May 2026 alt copy"),
    ("S206", "WF Jun 2026",               "bank-stmt","unknown","063026 WellsFargo.pdf",          "staged","WF Jun 2026"),
    ("S207", "WF Jun 2026 B",              "bank-stmt","unknown","063026 WellsFargo (1).pdf",     "staged","WF Jun 2026 alt copy"),
    ("S208", "WF Jun 2026 C",              "bank-stmt","unknown","063026 WellsFargo (2).pdf",     "staged","WF Jun 2026 alt copy"),

    # ── BANK STATEMENTS: CHASE ────────────────────────────────────────────────
    ("S210", "Chase statement (original)","bank-stmt","unknown","Chase statement.pdf",             "staged","Chase statement — entity unknown (personal credit card or SPLT Chase Ink?)"),
    ("S211", "Chase1.pdf",                "bank-stmt","unknown","Chase1.pdf",                     "staged","Chase statement 1 of 10"),
    ("S212", "Chase2.pdf",                "bank-stmt","unknown","Chase2.pdf",                     "staged",""),
    ("S213", "Chase3.pdf",                "bank-stmt","unknown","Chase3.pdf",                     "staged",""),
    ("S214", "Chase4.pdf",                "bank-stmt","unknown","Chase4.pdf",                     "staged",""),
    ("S215", "Chase5.pdf",                "bank-stmt","unknown","Chase5.pdf",                     "staged",""),
    ("S216", "Chase6.pdf",                "bank-stmt","unknown","Chase6.pdf",                     "staged",""),
    ("S217", "Chase7.pdf",                "bank-stmt","unknown","Chase7.pdf",                     "staged",""),
    ("S218", "Chase8.pdf",                "bank-stmt","unknown","Chase8.pdf",                     "staged",""),
    ("S219", "Chase9.pdf",                "bank-stmt","unknown","Chase9.pdf",                     "staged",""),
    ("S220", "Chase10.pdf",               "bank-stmt","unknown","Chase10.pdf",                    "staged","Chase statement 10 of 10"),

    # ── LEGAL / AGREEMENTS / NOTES ────────────────────────────────────────────
    ("S230", "Revolving_Loan_Agreement_SPLT_Nwosu",      "note","SPLT",       "Revolving_Loan_Agreement_SPLT_Nwosu (1).pdf",                          "staged","Revolving loan agreement SPLT ↔ Nwosu"),
    ("S231", "Intercompany_Settlement_Memo_2025_SPLT_SGM","note","all",       "files (1)/Intercompany_Settlement_Memo_2025_SPLT_SGM.docx",            "staged","Intercompany settlement memo 2025"),
    ("S232", "Promissory_Note_Chukwuezugo_SocialGear",    "note","SGM",       "files (1)/Promissory_Note_Chukwuezugo_SocialGear.docx",                "staged","Promissory note — Chukwuezugo ↔ SGM"),
    ("S233", "Asset_Reversion_Forward_Commitment_SGM_SPLT","other","all",     "files (1)/Asset_Reversion_Forward_Commitment_SGM_SPLT.docx",           "staged","Asset reversion commitment SGM ↔ SPLT"),
    ("S234", "Patent_Product_License_SPLT_to_SGM",        "other","all",      "files (1)/Patent_Product_License_SPLT_to_SGM.docx",                   "staged","Patent/product license SPLT → SGM"),
    ("S235", "Kickstarter_Proceeds_Assignment_Cyberbrands_SPLT","other","all","files (1)/Kickstarter_Proceeds_Assignment_Cyberbrands_SPLT.docx",      "staged","Kickstarter proceeds assignment Cyberbrands → SPLT"),
    ("S236", "Contractor_Services_Agreement_SPLT_SGM_v2", "other","all",      "files (1)/Contractor_Services_Agreement_SPLT_SGM_v2.docx",             "staged","Contractor services agreement v2"),
    ("S237", "Contractor_Services_Agreement_SPLT_SGM",    "other","all",      "files (1)/Contractor_Services_Agreement_SPLT_SGM.docx",                "staged","Contractor services agreement v1"),
    ("S238", "Mold_Services_Invoice_Completion_Chukwuezugo","other","unknown","files (1)/Mold_Services_Invoice_Completion_Chukwuezugo.docx",          "staged","Mold services invoice — relevant to COGS substantiation"),
    ("S239", "Vehicle_Use_Reimbursement_Agreement",       "other","Cyberbrands","files (1)/Vehicle_Use_Reimbursement_Agreement_Cyberbrands_SPLT.docx","staged","Vehicle use reimbursement Cyberbrands ↔ SPLT"),
    ("S240", "Warehouse_Rental_Agreement_SPLT",           "lease","SPLT",     "files (1)/Warehouse_Rental_Agreement_SPLT.docx",                      "staged","Warehouse rental agreement for SPLT"),
    ("S241", "Financial_Clarification_Memo_v3",           "other","all",      "files (1)/Financial_Clarification_Memo_2024_Revenue_v3.docx",         "staged","Financial clarification memo 2024 revenue v3 (latest)"),
    ("S242", "Financial_Clarification_Memo_v2",           "other","all",      "files (1)/Financial_Clarification_Memo_2024_Revenue_v2.docx",         "staged","Prior version"),
    ("S243", "Financial_Clarification_Memo_v1",           "other","all",      "files (1)/Financial_Clarification_Memo_2024_Revenue.docx",            "staged","Prior version"),
    ("S244", "SBA_Consent_Request_Letter_TEMPLATE",       "other","all",      "files (1)/SBA_Consent_Request_Letter_TEMPLATE.docx",                  "staged","SBA consent request letter template"),

    # ── INVOICES ──────────────────────────────────────────────────────────────
    ("S250", "Invoice Dec25 Splitflask.pdf",              "other","SPLT",     "Invoice Dec25 Splitflask.pdf",                                        "staged","Splitflask invoice Dec 2025"),
    ("S251", "Invoice INV-8707.pdf",                      "other","unknown",  "Invoice INV-8707.pdf",                                               "staged","Invoice INV-8707 — entity TBD"),
    ("S252", "Invoice INV-9143.pdf",                      "other","unknown",  "Invoice INV-9143.pdf",                                               "staged","Invoice INV-9143 — entity TBD"),

    # ── OTHER PDFs ────────────────────────────────────────────────────────────
    ("S260", "2026-06-19.pdf",                            "other","unknown",  "2026-06-19.pdf",                                                     "staged","Unknown document dated Jun 19 2026 — classify in Layer 0"),
    ("S261", "74F348C0-list.pdf",                         "other","unknown",  "74F348C0-7E04-4F82-ACB2-99423FC4915C-list.pdf",                      "staged","Unknown list document — UUID filename, classify in Layer 0"),
    ("S262", "Due Process Letter 2026-04-28",             "other","unknown",  "7855987406-04-28-26-Mailed Due Process Letter-19031.pdf",            "staged","Mailed Due Process Letter Apr 28 2026 — likely IRS or state notice"),
    ("S263", "SR20263613270.pdf",                         "other","unknown",  "SR20263613270.pdf",                                                  "staged","Document SR20263613270 — classify in Layer 0 (possibly IRS/CA service request)"),
    ("S264", "Disclosures 526 Houston.pdf",               "other","personal", "Disclosures  526 Houston.pdf",                                       "staged","Real estate disclosures — 526 Houston; personal asset, relevant to net-worth context"),

    # ── MISSING: Amazon 1099-K (SGM primary account) ─────────────────────────
    # NOTE: 2024-1099K.pdf variants may turn out to be this — pending verification
    ("S270", "[MISSING] Amazon 1099-K SGM 2024 (primary account)",
                                                          "1099-K","SGM",     "— not yet obtained —",
                                                          "missing","Amazon 1099-K for SGM/Splitflask main account 2024; 2024-1099K.pdf may be this — needs confirmation"),
    ("S271", "[MISSING] Amazon 1099-K Cyberbrands 2024 (confirm second account)",
                                                          "1099-K","Cyberbrands","— not yet obtained —",
                                                          "missing","Amazon-Cyberbrands-2024-1099K-2.pdf is staged but may be a summary, not the actual 1099-K form — confirm"),
    ("S272", "[MISSING] Amazon 1099-K 2025 (entity TBD)",
                                                          "1099-K","unknown", "— not yet obtained —",
                                                          "missing","2025-1099K.pdf is staged but platform/entity unconfirmed"),
]

for row in source_rows:
    ws_sources.append(list(row))

# widen local_path column
ws_sources.column_dimensions["E"].width = 70
ws_sources.column_dimensions["B"].width = 55
ws_sources.column_dimensions["G"].width = 65

# ── Tab 3: ChangeLog ──────────────────────────────────────────────────────────

changelog_headers = ["date", "key", "old_value", "new_value", "reason"]
make_tab(wb, "ChangeLog", changelog_headers)

# ── Tab 4: OpenItems ──────────────────────────────────────────────────────────

openitems_headers = ["item", "category", "blocks", "owner", "age_opened", "status", "notes"]
ws_open = make_tab(wb, "OpenItems", openitems_headers)

open_rows = [
    (
        "Kangdao ambiguous Sept 2024 wire",
        "investigate",
        "",
        "",
        TODAY,
        "open",
        "Wire appears in Sep 2024 bank records; payee/purpose unclear. See S172 (WF Sep 2024 unlabeled). Must determine entity, direction (payment vs receipt), and COGS vs intercompany vs other classification."
    ),
    (
        "Facebook ad spend: additive vs overlapping across bank + card records",
        "investigate",
        "SPLT profitability figures",
        "",
        TODAY,
        "open",
        "CPA action item. FB ad invoices exist for Splitflask 2024 (S090) and 2025 (S091) and for Cyberbrands (S092). Risk of double-counting if bank debits and card charges both captured. Affects SPLT net margin."
    ),
    (
        "Patent valuation range ($100K conservative vs ~$2M potential)",
        "investigate",
        "investor cascade figures",
        "",
        TODAY,
        "open",
        "Patent licensed SPLT → SGM (see S234). Conservative vs upside valuation affects balance sheet and investor-deck metrics. Needs independent support or agreed convention."
    ),
    (
        "COGS + platform-fee substantiation totals — grossing up to 1099-K floors only holds taxable income near as-filed if these are substantiated",
        "investigate",
        "net-revenue figures",
        "",
        TODAY,
        "open",
        "All net-revenue and profitability figures downstream are contingent on COGS and platform fees being verifiable. Mold invoice (S238), Amazon transaction CSVs (S070-S073), and TikTok detail CSVs (S060-S068) are primary substantiation sources."
    ),
]

for row in open_rows:
    ws_open.append(list(row))

ws_open.column_dimensions["A"].width = 65
ws_open.column_dimensions["C"].width = 30
ws_open.column_dimensions["G"].width = 80

# ── Tab 5: Intercompany ───────────────────────────────────────────────────────

interco_headers = [
    "txn_ref", "paid_by", "benefits", "amount",
    "third_party", "landed_on", "double_count_check", "notes"
]
make_tab(wb, "Intercompany", interco_headers)

# ── Tab 6: EntityMap ─────────────────────────────────────────────────────────

entity_headers = ["entity", "legal_name", "type", "ein", "primary_bank_acct", "notes"]
ws_entity = make_tab(wb, "EntityMap", entity_headers)

entity_rows = [
    ("SGM",        "Social Gear Media LLC",  "CA S-corp",        "83-3077502", "WF ending 8625", "Operating entity for Splitflask brand; holds Amazon/Shopify storefront; 1120-S filer"),
    ("SPLT",       "SPLT INC",               "C-corp (DE)",      "33-3094308", "WF ending 0423", "Formed Jan 2025; holds IP/patent; C-corp filer Form 1120; new entity in reconstruction"),
    ("Cyberbrands","Cyberbrands LLC",         "holding / related","EIN ending 7466","WF (see stmts)","Schedule C business on personal 1040; Amazon second account routed here; related entity"),
    ("personal",   "Arizechukwu Nwosu + Cheryl Benefield","personal","—","—","Personal 1040 filers; Cyberbrands Schedule C flows here"),
]

for row in entity_rows:
    ws_entity.append(list(row))

ws_entity.column_dimensions["B"].width = 30
ws_entity.column_dimensions["F"].width = 65

# ── Remove default sheet ──────────────────────────────────────────────────────

if "Sheet" in wb.sheetnames:
    del wb["Sheet"]

# ── Save ──────────────────────────────────────────────────────────────────────

out = "/Users/riz/Downloads/Splitflask-Financials/ledger.xlsx"
wb.save(out)
print(f"Saved {out}")
print(f"Tabs: {wb.sheetnames}")
print(f"Sources rows (excl header): {ws_sources.max_row - 1}")
print(f"OpenItems rows (excl header): {ws_open.max_row - 1}")
