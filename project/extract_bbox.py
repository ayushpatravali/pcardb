import fitz
doc = fitz.open('d:/PCARDB/project/backend/assets/templates/tractor_blank.pdf')
page = doc[0]
blocks = page.get_text('dict')['blocks']
for b in blocks:
    if 'lines' in b:
        for l in b['lines']:
            for s in l['spans']:
                print(f"Text: '{s['text']}' @ BBox: {s['bbox']}")
