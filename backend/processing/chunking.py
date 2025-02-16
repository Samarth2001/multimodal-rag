from models.schemas import DocumentChunk
from typing import List

class ChunkProcessor:
    @staticmethod
    def create_chunks(elements, image_paths: List[str]) -> List[DocumentChunk]:
        chunks = []
        page_number = 1
        
        for element in elements:
            metadata = {
                "type": element.category,
                "page_number": page_number,
                "coordinates": element.metadata.coordinates
            }
            
            if element.category == "Image":
                img_data = DocumentProcessor.image_to_base64(
                    next(p for p in image_paths if f"_page_{page_number}" in p)
                )
                chunks.append(DocumentChunk(
                    content=img_data,
                    type="image",
                    metadata=metadata,
                    page_number=page_number
                ))
            else:
                chunks.append(DocumentChunk(
                    content=str(element),
                    type=element.category.lower(),
                    metadata=metadata,
                    page_number=page_number
                ))
                
            if element.metadata.page_number != page_number:
                page_number = element.metadata.page_number
                
        return chunks