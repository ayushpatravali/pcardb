"""Canonical scheme specs — single source of truth for document generation.

SCHEMES maps SchemeType values to their spec dict. validate_all() checks
every field's `source` path resolves against the ORM models.
"""
from models import Application, SchemeType, DETAILS_MODEL
from schemas.tractor import SPEC as TRACTOR_SPEC

SCHEMES = {
    SchemeType.TRACTOR: TRACTOR_SPEC,
    # SchemeType.SHEEP_40/20/10, BULLOCK, LAND_DEV: added in Phase 4 rollout
}

# Context namespaces produced by render_service.build_context that are not
# direct ORM columns.
_VIRTUAL_NAMESPACES = ("computed.", "parsed.")


def validate_all() -> list:
    """Return a list of (scheme, key, problem) tuples; empty list = valid."""
    problems = []
    for scheme, spec in SCHEMES.items():
        details_model = DETAILS_MODEL[scheme]
        seen_keys = set()
        for field in spec["fields"]:
            key, source, tier = field["key"], field["source"], field["tier"]
            if key in seen_keys:
                problems.append((scheme.value, key, "duplicate key"))
            seen_keys.add(key)
            if tier == "handwritten" or source.startswith(_VIRTUAL_NAMESPACES):
                continue
            if source.startswith("app."):
                attr = source[len("app."):]
                if attr not in Application.model_fields:
                    problems.append((scheme.value, key, f"Application has no column {attr!r}"))
            elif source.startswith("details."):
                attr = source[len("details."):]
                if attr not in details_model.model_fields:
                    problems.append(
                        (scheme.value, key, f"{details_model.__name__} has no column {attr!r}")
                    )
            else:
                problems.append((scheme.value, key, f"unknown source namespace {source!r}"))
    return problems
