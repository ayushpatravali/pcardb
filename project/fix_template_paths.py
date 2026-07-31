import os

# Fix the template directory paths in generator.py
generator_path = 'backend/services/generator.py'

with open(generator_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the TEMPLATE_DIR default - should point to legacy_assets/excell workbooks
# From backend/services: ../../../legacy_assets/excell workbooks
old_template_line = 'TEMPLATE_DIR = os.environ.get("TEMPLATE_DIR", os.path.join(BASE_DIR, "..", "..", "excell workbooks"))'
new_template_line = 'TEMPLATE_DIR = os.environ.get("TEMPLATE_DIR", os.path.join(BASE_DIR, "..", "..", "legacy_assets", "excell workbooks"))'

# Fix the fallback path - should also point to legacy_assets/excell workbooks
# From backend/services: ../../../legacy_assets/excell workbooks
old_fallback_line = "fallback = os.path.join(BASE_DIR, '..', 'legacy_assets', 'excell workbooks')"
new_fallback_line = "fallback = os.path.join(BASE_DIR, '..', '..', 'legacy_assets', 'excell workbooks')"

# Apply fixes
content = content.replace(old_template_line, new_template_line)
content = content.replace(old_fallback_line, new_fallback_line)

with open(generator_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed template paths in generator.py")
print(f"Changed: {old_template_line}")
print(f"To:      {new_template_line}")
print(f"Changed: {old_fallback_line}")
print(f"To:      {new_fallback_line}")