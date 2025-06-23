import requests
import json
from typing import List
from config import Config

class Summarizer:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": Config.SITE_URL,
            "X-Title": Config.SITE_NAME,
        }
        
    def summarize_text(self, texts: List[str]) -> List[str]:
        """Summarize text chunks using OpenRouter with Gemini"""
        summaries = []
        for text in texts:
            payload = {
                "model": Config.CHAT_MODEL,
                "messages": [
                    {"role": "user", "content": f"Summarize this text chunk about AI architectures: {text}"}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            
            response = requests.post(
                f"{Config.OPENROUTER_API_BASE}chat/completions",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                summary = result["choices"][0]["message"]["content"]
                summaries.append(summary)
            else:
                summaries.append(f"Error summarizing text: {response.status_code}")
                
        return summaries
    
    def summarize_images(self, images: List[str]) -> List[str]:
        """Describe images using OpenRouter with Gemini's multimodal capabilities"""
        descriptions = []
        for image_data in images:
            payload = {
                "model": Config.CHAT_MODEL,
                "messages": [
                    {
                        "role": "user", 
                        "content": [
                            {"type": "text", "text": "Describe this technical diagram in detail"},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                        ]
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            
            response = requests.post(
                f"{Config.OPENROUTER_API_BASE}chat/completions",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                description = result["choices"][0]["message"]["content"]
                descriptions.append(description)
            else:
                descriptions.append(f"Error describing image: {response.status_code}")
                
        return descriptions