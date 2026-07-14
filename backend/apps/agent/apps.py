import os
from django.apps import AppConfig

class AgentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.agent'
    verbose_name = 'Agent'

    def ready(self):
        # Automatically extract EAGLE prompt text if not already done
        pdf_path = "/Users/kibobodjona/.gemini/antigravity/brain/6b5df5da-ac4a-41ba-bb27-313dbbb105a8/media__1783896270586.pdf"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        out_dir = os.path.join(current_dir, "prompts")
        out_path = os.path.join(out_dir, "eagle.txt")
        
        if not os.path.exists(out_path) and os.path.exists(pdf_path):
            os.makedirs(out_dir, exist_ok=True)
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(pdf_path)
                text = ""
                for page in doc:
                    text += page.get_text()
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(text)
            except Exception as e:
                # Log or print error
                print(f"Error extracting EAGLE PDF: {e}")
