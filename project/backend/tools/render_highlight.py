"""Render a packet with every UI-input-driven value highlighted yellow.

For bank review: highlighted regions = data typed in the web form (or derived
from it); everything unhighlighted is the fixed template or handwritten space.

Templates are NOT modified — highlighting is injected at render time by
wrapping context values and output filters.

Usage (from backend/):
  DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib python tools/render_highlight.py [application_id]
Defaults to the Vasant Malli fixture if no id given.
"""
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

HL = '<span style="background:#ffe066">{}</span>'


def mark(value):
    return HL.format(value)


def wrap_obj(obj, fields):
    """Copy ORM object to a namespace, wrapping string values in highlight spans.
    Numeric values stay numeric (templates do arithmetic on them); they get
    highlighted at output time via the wrapped filters instead."""
    ns = SimpleNamespace()
    for f in fields:
        v = getattr(obj, f, None)
        setattr(ns, f, mark(v) if isinstance(v, str) and v else v)
    return ns


def wrap_dicts(items):
    return [
        {k: (mark(v) if isinstance(v, str) and v else v) for k, v in d.items()}
        if isinstance(d, dict) else d
        for d in items
    ]


def main():
    from models import Application, SchemeType
    from schemas import SCHEMES
    from services.render_service import (
        OUTPUT_DIR, build_context, _jinja_env, render_html_to_pdf,
    )

    if len(sys.argv) > 1:
        from sqlmodel import Session
        from database import engine
        from routers.applications import get_details
        with Session(engine) as session:
            app = session.get(Application, int(sys.argv[1]))
            details = get_details(session, app)
    else:
        from tools.render_test import FIXTURE_APP as app, FIXTURE_DETAILS as details

    spec = SCHEMES[SchemeType(app.scheme_type)]
    ctx = build_context(app, details, spec)

    # Wrap input-derived values
    ctx["app"] = wrap_obj(app, list(Application.model_fields))
    if details is not None:
        ctx["details"] = wrap_obj(details, list(type(details).model_fields))
    ctx["parsed"] = {k: wrap_dicts(v) for k, v in ctx["parsed"].items()}
    ctx["computed"] = {
        k: (mark(v) if isinstance(v, str) and v else v)
        for k, v in ctx["computed"].items()
    }
    ctx["scheme"] = {k: mark(v) if v else v for k, v in ctx["scheme"].items()}

    # Wrap output filters so numeric values (which stay raw for arithmetic)
    # are highlighted at the point they are printed.
    env = _jinja_env()
    for name in ("num", "inr", "dmy", "format"):
        original = env.filters[name]

        def wrapped(value, *a, _orig=original, **kw):
            out = _orig(value, *a, **kw)
            return mark(out) if out not in ("", None) and "ffe066" not in str(value) else out

        env.filters[name] = wrapped

    html = env.get_template("packet.html").render(**ctx)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUTPUT_DIR / f"HIGHLIGHTED_{SchemeType(app.scheme_type).value}_{app.id or 'fixture'}.pdf"
    render_html_to_pdf(html, out)
    print(f"highlighted packet: {out}")


if __name__ == "__main__":
    main()
