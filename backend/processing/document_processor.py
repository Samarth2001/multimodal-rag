from unstructured.partition.pdf import partition_pdf
from typing import List, Tuple
import base64

class DocumentProcessor:
    def process_pdf(self, file_bytes: bytes) -> Tuple[List, List, List]:
        elements = partition_pdf(
            file=file_bytes,
            infer_table_structure=True,
            strategy="hi_res",
            extract_image_block_types=["Image", "Table"],
            chunking_strategy="by_title",
            max_characters=4000,
            combine_text_under_n_chars=2000,
        )

        texts = []
        tables = []
        images = []

        for el in elements:
            if "CompositeElement" in str(type(el)):
                texts.append(el.text)
            elif "Table" in str(type(el)):
                tables.append(el.metadata.text_as_html)
            elif "Image" in str(type(el)):
                images.append(base64.b64encode(el._image_array).decode("utf-8"))

        return texts, tables, images