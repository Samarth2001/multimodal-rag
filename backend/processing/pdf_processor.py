from unstructured.partition.pdf import partition_pdf
from unstructured.documents.elements import CompositeElement, Table
from typing import List
from config import Config
import os
import tempfile
import logging
import PyPDF2
from io import BytesIO
# You might need a simple HTML to text converter for tables
# from bs4 import BeautifulSoup # Example, install if used

logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self):
        os.makedirs(Config.PDF_UPLOAD_DIR, exist_ok=True)
        
    def _clean_table_html(self, html_content: str) -> str:
        """Basic HTML to text conversion for tables"""
        # Remove HTML tags and return clean text
        import re
        clean_text = re.sub('<.*?>', ' ', html_content)
        clean_text = re.sub(r'\s+', ' ', clean_text)
        return clean_text.strip()

    def _extract_text_with_pypdf2(self, file_bytes: bytes) -> List[str]:
        """Fallback text extraction using PyPDF2"""
        try:
            logger.info("Attempting text extraction with PyPDF2 fallback")
            pdf_file = BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_chunks = []
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    text = page.extract_text()
                    if text.strip():
                        # Split long pages into chunks
                        words = text.split()
                        if len(words) > 200:  # If page is too long, split it
                            for i in range(0, len(words), 200):
                                chunk = ' '.join(words[i:i+200])
                                if chunk.strip():
                                    text_chunks.append(chunk.strip())
                        else:
                            text_chunks.append(text.strip())
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num}: {e}")
                    continue
                    
            return text_chunks
            
        except Exception as e:
            logger.error(f"PyPDF2 fallback failed: {e}")
            return []

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into smaller chunks if needed"""
        if len(text) <= Config.CHUNK_SIZE:
            return [text]
        
        chunks = []
        words = text.split()
        current_chunk = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 > Config.CHUNK_SIZE and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_length = len(word)
            else:
                current_chunk.append(word)
                current_length += len(word) + 1
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
            
        return chunks

    def process_pdf(self, file_bytes: bytes, filename: str) -> List[str]:
        """Process PDF with robust error handling and fallback methods"""
        temp_file = None
        try:
            # Create temporary file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name
            
            logger.info(f"Processing PDF: {filename} (size: {len(file_bytes)} bytes)")
            
            # Try unstructured first
            try:
                elements = partition_pdf(
                    filename=temp_file_path,
                    strategy="fast",
                    max_characters=Config.CHUNK_SIZE,
                    new_after_n_chars=Config.CHUNK_SIZE,
                    combine_text_under_n_chars=Config.CHUNK_OVERLAP,
                    infer_table_structure=True
                )
                
                processed_chunks = []
                for el in elements:
                    try:
                        if isinstance(el, CompositeElement):
                            text = el.text.strip()
                            if text:
                                # Further chunk if needed
                                chunks = self._chunk_text(text)
                                processed_chunks.extend(chunks)
                        elif isinstance(el, Table):
                            # Handle table elements
                            if hasattr(el, 'metadata') and hasattr(el.metadata, 'text_as_html'):
                                table_text = self._clean_table_html(el.metadata.text_as_html)
                                if table_text:
                                    processed_chunks.append(f"[Table] {table_text}")
                            elif el.text:
                                processed_chunks.append(f"[Table] {el.text.strip()}")
                        else:
                            # Handle other element types
                            if hasattr(el, 'text') and el.text:
                                text = el.text.strip()
                                if text:
                                    chunks = self._chunk_text(text)
                                    processed_chunks.extend(chunks)
                    except Exception as e:
                        logger.warning(f"Error processing element: {e}")
                        continue
                
                # Filter out empty chunks
                processed_chunks = [chunk for chunk in processed_chunks if chunk.strip()]
                
                if processed_chunks:
                    logger.info(f"Unstructured extracted {len(processed_chunks)} chunks")
                    return processed_chunks
                else:
                    logger.warning("Unstructured extraction returned no chunks, trying fallback")
                    
            except Exception as e:
                logger.warning(f"Unstructured processing failed: {e}, trying fallback")
            
            # Fallback to PyPDF2
            fallback_chunks = self._extract_text_with_pypdf2(file_bytes)
            if fallback_chunks:
                logger.info(f"PyPDF2 fallback extracted {len(fallback_chunks)} chunks")
                return fallback_chunks
            
            # If all methods fail, raise an error
            raise ValueError("No text could be extracted from the PDF document")
            
        except Exception as e:
            logger.error(f"PDF processing failed for {filename}: {e}")
            raise ValueError(f"Failed to extract text from document: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_file and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.warning(f"Failed to clean up temp file: {e}")