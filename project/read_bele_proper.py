import openpyxl
wb = openpyxl.load_workbook('Bele chart Temp.xlsx', data_only=True)
sheet = wb.active

# Print all rows with values
for row_idx, row in enumerate(sheet.iter_rows(values_only=True), 1):
    # Check if row has meaningful data
    if any(cell is not None for cell in row):
        print(f"Row {row_idx}: {row}")