import fitz # PyMuPDF
import os

pdf_path = "/Users/kibobodjona/.gemini/antigravity/brain/6b5df5da-ac4a-41ba-bb27-313dbbb105a8/media__1783896270586.pdf"
out_dir = "backend/apps/agent/prompts"
out_path = os.path.join(out_dir, "eagle.txt")

os.makedirs(out_dir, exist_ok=True)

try:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Successfully extracted {len(text)} characters to {out_path}")
except Exception as e:
    print(f"Error: {e}")
