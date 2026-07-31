"""Compare a generated packet against the bank's reference PDF.

Usage (from backend/):
  python tools/compare_pdfs.py <generated.pdf> [reference.pdf]

Hard asserts: page count. Advisory: writes side-by-side page images to
tools/diff_out/ for human review (fonts legitimately differ from the Nudi
originals, so pixel-diff is not authoritative).

Requires poppler (pdftoppm) — `brew install poppler`.
"""
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
DEFAULT_REFERENCE = (
    BACKEND.parent.parent / "legacy_assets" / "pdfss" / "Vasant Malli Tractor Scheme.pdf"
)
DIFF_OUT = Path(__file__).resolve().parent / "diff_out"


def page_count(pdf: Path) -> int:
    out = subprocess.run(
        ["pdfinfo", str(pdf)], capture_output=True, text=True, check=True
    ).stdout
    for line in out.splitlines():
        if line.startswith("Pages:"):
            return int(line.split()[-1])
    raise RuntimeError(f"could not read page count of {pdf}")


def rasterize(pdf: Path, out_prefix: Path):
    out_prefix.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["pdftoppm", "-r", "100", "-png", str(pdf), str(out_prefix)], check=True
    )


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    generated = Path(sys.argv[1])
    reference = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_REFERENCE

    gen_pages = page_count(generated)
    ref_pages = page_count(reference)
    status = "OK" if gen_pages == ref_pages else "MISMATCH"
    print(f"page count: generated={gen_pages} reference={ref_pages} -> {status}")

    rasterize(generated, DIFF_OUT / "gen")
    rasterize(reference, DIFF_OUT / "ref")
    print(f"page images written to {DIFF_OUT}/ (gen-N.png vs ref-N.png) for review")

    return 0 if status == "OK" else 1


if __name__ == "__main__":
    sys.exit(main())
