from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

class Summarizer:
    def __init__(self):
        self.text_model = ChatGroq(temperature=0.3, model="llama3-8b-8192")
        self.image_model = ChatOpenAI(model="gpt-4o", max_tokens=1000)
        
    def summarize_text(self, texts: List[str]) -> List[str]:
        prompt = ChatPromptTemplate.from_template(
            "Summarize this text chunk about AI architectures: {text}"
        )
        chain = prompt | self.text_model
        return chain.batch([{"text": t} for t in texts])
    
    def summarize_images(self, images: List[str]) -> List[str]:
        prompt = ChatPromptTemplate.from_messages([
            ("user", [
                {"type": "text", "text": "Describe this technical diagram in detail"},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}}
            ])
        ])
        chain = prompt | self.image_model
        return chain.batch([{"image": img} for img in images])