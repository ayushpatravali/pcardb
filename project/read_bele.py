import openpyxl
wb = openpyxl.load_workbook('Bele chart Temp.xlsx')
sheet = wb.active
for row in sheet.iter_rows(values_only=True):
    print(row)