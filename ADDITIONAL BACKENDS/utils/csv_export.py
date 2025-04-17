from io import StringIO
import csv
from fastapi.responses import StreamingResponse

def dicts_to_csv_response(data: list[dict], headers: list[str], filename: str):
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        output, media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
