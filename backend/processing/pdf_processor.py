from unstructured.partition.pdf import partition_pdf
from typing import List
import os

class PDFProcessor:
    def __init__(self):
        os.makedirs(Config.PDF_UPLOAD_DIR, exist_ok=True)
        
    def process_pdf(self, file_bytes: bytes, filename: str) -> List[str]:
        file_path = os.path.join(Config.PDF_UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        elements = partition_pdf(
            filename=file_path,
            strategy="fast",
            chunking_strategy="by_title",
            max_characters=Config.CHUNK_SIZE,
            new_after_n_chars=Config.CHUNK_SIZE,
            combine_text_under_n_chars=Config.CHUNK_OVERLAP
        )
        
        return [str(el) for el in elements if "CompositeElement" in str(type(el))]