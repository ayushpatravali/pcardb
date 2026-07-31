import os

generator_path = 'backend/services/generator.py'

# Read the file
with open(generator_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix the TEMPLATE_DIR line (line 8, 0-indexed)
lines[8] = 'TEMPLATE_DIR = os.environ.get("TEMPLATE_DIR", os.path.join(BASE_DIR, "..", "..", "legacy_assets", "excell workbooks"))\n'

# Fix the fallback line in get_template_path (line 29, 0-indexed - it's line 30 in 1-indexed)
lines[29] = '    fallback = os.path.join(BASE_DIR, "..", "..", "legacy_assets", "excell workbooks", filename)\n'

# Write back
with open(generator_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed both TEMPLATE_DIR and fallback paths in generator.py")