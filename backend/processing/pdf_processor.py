from unstructured.partition.pdf import partition_pdf
from unstructured.documents.elements import CompositeElement, Table # Import Table element
from typing import List
from config import Config
import os
# You might need a simple HTML to text converter for tables
# from bs4 import BeautifulSoup # Example, install if used

class PDFProcessor:
    def __init__(self):
        os.makedirs(Config.PDF_UPLOAD_DIR, exist_ok=True)
        
    def _clean_table_html(self, html_content: str) -> str:
        # Basic placeholder: extract text from HTML.
        # For robust parsing, consider libraries like BeautifulSoup or html2text.
        # This is a very naive approach, replace with better parsing.
        # from bs4 import BeautifulSoup
        # soup = BeautifulSoup(html_content, 'html.parser')
        # return soup.get_text(separator=' ', strip=True)
        # For now, just return a placeholder indicating it's a table
        # and try to return the raw string if complex parsing is not immediately set up.
        # A better approach would be to extract meaningful text.
        return f"[Table Content: {html_content[:200]}...]" # Return part of the HTML as placeholder


    def process_pdf(self, file_bytes: bytes, filename: str) -> List[str]:
        file_path = os.path.join(Config.PDF_UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:\
            f.write(file_bytes)
            
        elements = partition_pdf(
            filename=file_path,
            strategy="fast", # Consider "hi_res" for more complex docs if "fast" misses things
            # chunking_strategy="by_title", # You might remove this if handling elements individually
            max_characters=Config.CHUNK_SIZE, 
            new_after_n_chars=Config.CHUNK_SIZE, # Revisit these if using element-wise processing
            combine_text_under_n_chars=Config.CHUNK_OVERLAP,
            infer_table_structure=True # Important for better table extraction
        )
        
        processed_chunks = []
        for el in elements:
            if isinstance(el, CompositeElement):\
                # This is typically text, could be a paragraph or title
                processed_chunks.append(el.text.strip())
            elif isinstance(el, Table):\
                # Element is a table
                table_text = el.metadata.text_as_html
                if table_text:
                    # cleaned_table_text = self._clean_table_html(table_text)
                    # For now, let's just use the text representation if available
                    # or the HTML if not. Unstructured aims to provide el.text for tables too.
                    processed_chunks.append(f"[Table: {el.text.strip()[:300]}...] ") # Or use cleaned_table_text
                else:
                    processed_chunks.append("[Table: (content not extracted as HTML)]")
            # Add elif for Images if you were to process image elements directly from 'elements'
            # Example:
            # elif el.category == "Image":
            #    img_path = el.metadata.image_path # If available
            #    # Generate description, add to chunks
            #    processed_chunks.append(f"[Image at {img_path} - Description needed]")

        # Filter out empty strings that might result from processing
        processed_chunks = [chunk for chunk in processed_chunks if chunk]

        # If you are not using chunking_strategy in partition_pdf,
        # you might need to re-chunk the processed_chunks here if they are too large
        # or implement a more sophisticated chunking based on the element types.
        # For now, this example assumes elements are reasonably sized or partition_pdf's
        # max_characters helps manage this.

        return processed_chunks