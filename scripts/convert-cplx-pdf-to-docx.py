#!/usr/bin/env python3
"""
Convert public/CPLX_rules.pdf to Word .docx (layout-preserving where possible).

Usage (from cpl/):
  pip install pdf2docx
  python scripts/convert-cplx-pdf-to-docx.py

Output: data/CPLX_rules.docx (created next to other source assets)
"""
from pathlib import Path

try:
    from pdf2docx import Converter
except ImportError:
    raise SystemExit(
        "Missing dependency. Install with:\n  pip install pdf2docx\n"
    ) from None

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "public" / "CPLX_rules.pdf"
OUT = ROOT / "data" / "CPLX_rules.docx"


def main() -> None:
    if not PDF.is_file():
        raise SystemExit(
            f"PDF not found: {PDF}\n"
            "Place CPLX_rules.pdf in the public folder and run again."
        )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cv = Converter(str(PDF))
    try:
        cv.convert(str(OUT))
    finally:
        cv.close()
    print(f"Wrote: {OUT}")


if __name__ == "__main__":
    main()
