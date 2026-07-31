import fitz
doc = fitz.open('D:/PCARDB/legacy_assets/pdfss/Vasant Malli Tractor Scheme.pdf')
with open('d:/PCARDB/project/bbox.txt', 'w', encoding='utf-8') as f:
    for b in doc[0].get_text('dict')['blocks']:
        if 'lines' in b:
            for l in b['lines']:
                for s in l['spans']:
                    f.write(f"{s['bbox']}: {s['text']}\n")
