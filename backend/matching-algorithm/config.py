from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Worker settings loaded from environment variables"""

    # API (worker service)
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_DEBUG: bool = False

    # Matching Algorithm
    DEFAULT_SEARCH_RADIUS_KM: float = 50.0
    MAX_RESULTS: int = 30
    
    # Lower threshold for more flexible matching
    SIMILARITY_THRESHOLD: float = 0.20 
    
    # Price flexibility (allow 25% over max price for visibility)
    PRICE_TOLERANCE_PERCENT: float = 0.25

    # Semantic Search
    # Semantic Search Provider
    # Options: "fuzzy_only", "huggingface", "openai"
    # "fuzzy_only": Lightweight Levenshtein distance (Fastest, no API key needed)
    # "huggingface": Uses Hugging Face Inference API (Requires HF_API_KEY)
    # "openai": Uses OpenAI Embeddings API (Requires OPENAI_API_KEY)
    SEMANTIC_PROVIDER: str = "fuzzy_only"
    
    # API Keys (Optional, depending on provider)
    HF_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Model Names (for API reference)
    HF_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    OPENAI_MODEL: str = "text-embedding-3-small"

    # Weights (Restored)
    USE_SEMANTIC_SEARCH: bool = True
    SEMANTIC_WEIGHT: float = 0.8  
    FUZZY_WEIGHT: float = 0.2  

    @model_validator(mode='after')
    def check_semantic_config(self):
        # Auto-configure provider if keys are present
        if self.OPENAI_API_KEY:
            self.SEMANTIC_PROVIDER = "openai"
            self.USE_SEMANTIC_SEARCH = True
        elif self.HF_API_KEY:
            self.SEMANTIC_PROVIDER = "huggingface"
            self.USE_SEMANTIC_SEARCH = True
        else:
            self.SEMANTIC_PROVIDER = "fuzzy_only"
            self.USE_SEMANTIC_SEARCH = False
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
