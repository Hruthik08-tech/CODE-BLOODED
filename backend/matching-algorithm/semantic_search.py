"""
Main Algorithm 
Semantic Search Module for Waste Exchange Matching

This module uses External APIs (HuggingFace or OpenAI) or Fuzzy Matching 
to understand semantic similarity.
"""

import requests
import numpy as np
import time
from typing import List, Tuple, Optional
from functools import lru_cache
from config import get_settings

# Global settings
settings = get_settings()

class SemanticMatcher:
    """
    Handles semantic matching using API-based embeddings or lightweight fallback.
    """
    
    def __init__(self):
        self.provider = settings.SEMANTIC_PROVIDER
        print(f"Initializing SemanticMatcher with provider: {self.provider}")
        
    @lru_cache(maxsize=1000)
    def get_embedding(self, text: str) -> np.ndarray:
        """
        Get embedding for text from configured API.
        Cached to reduce API calls.
        """
        if not text:
            return np.zeros(384) # Default size for MiniLM
            
        text = text.lower().strip()
        
        try:
            if self.provider == "openai":
                return self._get_openai_embedding(text)
            elif self.provider == "huggingface":
                return self._get_hf_embedding(text)
            else:
                # Fuzzy only / Fallback
                return np.zeros(384)
        except Exception as e:
            print(f"Error fetching embedding ({self.provider}): {e}")
            return np.zeros(384)

    def _get_hf_embedding(self, text: str) -> np.ndarray:
        """Fetch embedding from Hugging Face Inference API"""
        api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{settings.HF_MODEL}"
        headers = {}
        if settings.HF_API_KEY:
            headers["Authorization"] = f"Bearer {settings.HF_API_KEY}"
            
        # Retry logic
        for _ in range(3):
            response = requests.post(api_url, headers=headers, json={"inputs": text, "options": {"wait_for_model": True}})
            if response.status_code == 200:
                data = response.json()
                # HF returns list of floats (embedding) directly or list of list (if batch)
                if isinstance(data, list):
                    # Check if it's a list of floats or list of list
                    if data and isinstance(data[0], list):
                         return np.array(data[0]) 
                    return np.array(data)
            elif response.status_code == 503:
                # Model loading
                time.sleep(2)
                continue
            else:
                print(f"HF API Error {response.status_code}: {response.text}")
                break
                
        raise Exception("Failed to get HF embedding")

    def _get_openai_embedding(self, text: str) -> np.ndarray:
        """Fetch embedding from OpenAI API"""
        if not settings.OPENAI_API_KEY:
             raise Exception("OPENAI_API_KEY not set")
             
        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "input": text,
            "model": settings.OPENAI_MODEL
        }
        
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            res_json = response.json()
            vec = res_json['data'][0]['embedding']
            return np.array(vec)
        else:
             raise Exception(f"OpenAI API Error: {response.text}")

    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        # If vectors are zero (failed embedding), return 0
        if np.all(vec1 == 0) or np.all(vec2 == 0):
            return 0.0
            
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(np.dot(vec1, vec2) / (norm1 * norm2))
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts."""
        if self.provider == "fuzzy_only":
            return 0.0
            
        vec1 = self.get_embedding(text1)
        vec2 = self.get_embedding(text2)
        
        return self.cosine_similarity(vec1, vec2)

# Global instance
_semantic_matcher = None

def get_semantic_matcher() -> SemanticMatcher:
    global _semantic_matcher
    if _semantic_matcher is None:
        _semantic_matcher = SemanticMatcher()
    return _semantic_matcher

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Convenience function."""
    matcher = get_semantic_matcher()
    return matcher.calculate_similarity(text1, text2)
