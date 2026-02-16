"""
Matching Worker — A pure computation microservice.

This worker does NOT:
  - Manage cache (Redis)
  - Perform CRUD operations
  - Access the database directly

It ONLY:
  - Receives supply/demand data via HTTP from the Node.js server
  - Computes match scores using semantic + fuzzy + token matching
  - Returns scored results with personalized breakdowns back to the server

Architecture:
  Frontend → nginx → Node.js Server → [Cache check] → Matching Worker
                                                      ↓
                                               Store in Cache
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from utils import (
    calculate_distance,
    calculate_hybrid_similarity,
    calculate_match_score_detailed,
    tokenize,
    calculate_token_overlap,
)
import os


from config import get_settings

settings = get_settings()

# ═══════════════════════════════════════════════════════════════
# Worker FastAPI App
# ═══════════════════════════════════════════════════════════════
app = FastAPI(
    title="Matching Worker",
    description="Pure computation worker for supply-demand matching",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# Request/Response schemas
# ═══════════════════════════════════════════════════════════════

class OrgData(BaseModel):
    """Organisation data sent by the server"""
    org_id: int
    org_name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float


class SupplyData(BaseModel):
    """Supply item data sent by the server"""
    supply_id: int
    org_id: int
    item_name: str
    item_category: Optional[str] = None
    category_id: Optional[int] = None
    item_description: Optional[str] = None
    price_per_unit: Optional[float] = None
    currency: Optional[str] = "USD"
    quantity: Optional[float] = None
    quantity_unit: Optional[str] = None
    search_radius: Optional[float] = 50.0


class DemandData(BaseModel):
    """Demand item data sent by the server"""
    demand_id: int
    org_id: int
    item_name: str
    item_category: Optional[str] = None
    category_id: Optional[int] = None
    item_description: Optional[str] = None
    max_price_per_unit: Optional[float] = None
    currency: Optional[str] = "USD"
    quantity: Optional[float] = None
    quantity_unit: Optional[str] = None


class MatchSupplyRequest(BaseModel):
    class Candidate(BaseModel):
        demand: DemandData
        org: OrgData

    supply: SupplyData
    supply_org: OrgData
    search_radius: float = 50.0
    candidates: List[Candidate]


class MatchDemandRequest(BaseModel):
    class Candidate(BaseModel):
        supply: SupplyData
        org: OrgData

    demand: DemandData
    demand_org: OrgData
    search_radius: float = 50.0
    candidates: List[Candidate]


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown for frontend display"""
    similarity: float = 0.0
    distance: float = 0.0
    price: float = 0.0
    quantity: float = 0.0


class MatchLabels(BaseModel):
    """Human-readable labels for match context"""
    price: str = "unknown"
    quantity: str = "unknown"
    fulfillment_pct: Optional[float] = None


class MatchResult(BaseModel):
    """A single scored match result with personalized breakdown"""
    id: int
    org_id: int
    org_name: str
    item_name: str
    item_category: Optional[str] = None
    item_description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    quantity: Optional[float] = None
    quantity_unit: Optional[str] = None
    distance_km: float
    name_similarity: float
    match_score: float
    # Personalized breakdown
    score_breakdown: Optional[ScoreBreakdown] = None
    match_labels: Optional[MatchLabels] = None
    category_matched: bool = False
    # Org contact details
    org_email: Optional[str] = None
    org_phone: Optional[str] = None
    org_address: Optional[str] = None
    org_latitude: float
    org_longitude: float


class MatchResponse(BaseModel):
    """Worker response with scored + ranked results"""
    total_results: int
    results: List[MatchResult]
    computed_at: str


# ═══════════════════════════════════════════════════════════════
# Shared Matching Logic
# ═══════════════════════════════════════════════════════════════

def check_category_match(
    cat_id_a: Optional[int],
    cat_id_b: Optional[int],
    cat_name_a: Optional[str],
    cat_name_b: Optional[str],
) -> bool:
    """
    Consistent category matching used in BOTH directions.
    1. ID match (exact)
    2. String exact match (case-insensitive)
    3. Substring containment (e.g., "Grains" in "Grains & Flour")
    """
    # ID match
    if cat_id_a is not None and cat_id_b is not None:
        if cat_id_a == cat_id_b:
            return True
    
    # String match
    a = (cat_name_a or "").lower().strip()
    b = (cat_name_b or "").lower().strip()
    
    if not a or not b:
        return False
    
    # Exact string
    if a == b:
        return True
    
    # Substring containment
    if a in b or b in a:
        return True
    
    return False


def build_rich_text(item_name: str, item_description: str = None, item_category: str = None) -> str:
    """Build rich comparison text from item fields."""
    parts = [item_name or ""]
    if item_description:
        parts.append(item_description)
    if item_category:
        parts.append(item_category)
    return " ".join(parts).strip()


# Minimum score to include in results (lower = more results)
MIN_MATCH_SCORE = 0.25


# ═══════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Matching Worker",
        "version": "3.0.0",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/match/supply-to-demands", response_model=MatchResponse, tags=["Matching"])
async def match_supply_to_demands(request: MatchSupplyRequest):
    """
    Compute matches: Supply → Demands.
    Returns scored results with personalized breakdowns.
    """
    try:
        supply = request.supply
        supply_org = request.supply_org
        search_radius = request.search_radius
        results = []

        print(f"[Worker] Processing Supply→Demands for Supply ID: {supply.supply_id}. "
              f"Candidates: {len(request.candidates)}. Radius: {search_radius}km")

        supply_text = build_rich_text(supply.item_name, supply.item_description, supply.item_category)

        for candidate in request.candidates:
            dem = candidate.demand
            org = candidate.org

            try:
                # Distance
                distance_km = calculate_distance(
                    supply_org.latitude, supply_org.longitude,
                    org.latitude, org.longitude
                )

                if distance_km > search_radius:
                    continue

                # Category match (consistent logic)
                cat_match = check_category_match(
                    supply.category_id, dem.category_id,
                    supply.item_category, dem.item_category
                )

                # Build rich text for similarity
                demand_text = build_rich_text(dem.item_name, dem.item_description, dem.item_category)

                # Hybrid similarity
                try:
                    name_similarity = calculate_hybrid_similarity(
                        supply_text,
                        demand_text,
                        use_semantic=settings.USE_SEMANTIC_SEARCH,
                        semantic_weight=settings.SEMANTIC_WEIGHT,
                        fuzzy_weight=settings.FUZZY_WEIGHT
                    )
                except Exception as e:
                    print(f"[Worker] Similarity calc failed: {e}")
                    name_similarity = 0.0

                # Skip only if NEITHER category nor name matches
                if not cat_match and name_similarity < settings.SIMILARITY_THRESHOLD:
                    continue

                # Category boost: moderate, not overwhelming
                if cat_match:
                    effective_sim = max(name_similarity, 0.65)
                    # Additional boost proportional to name similarity
                    effective_sim = min(1.0, effective_sim + 0.15)
                else:
                    effective_sim = name_similarity

                # Detailed match score with breakdown
                score_detail = calculate_match_score_detailed(
                    distance_km=distance_km,
                    similarity_score=effective_sim,
                    supply_price=supply.price_per_unit,
                    demand_max_price=dem.max_price_per_unit,
                    max_distance=search_radius,
                    supply_qty=supply.quantity,
                    supply_unit=supply.quantity_unit,
                    demand_qty=dem.quantity,
                    demand_unit=dem.quantity_unit,
                    price_tolerance=settings.PRICE_TOLERANCE_PERCENT
                )

                match_score = score_detail["match_score"]

                if match_score < MIN_MATCH_SCORE:
                    continue

                results.append(MatchResult(
                    id=dem.demand_id,
                    org_id=org.org_id,
                    org_name=org.org_name,
                    item_name=dem.item_name,
                    item_category=dem.item_category,
                    item_description=dem.item_description,
                    price=dem.max_price_per_unit,
                    currency=dem.currency,
                    quantity=dem.quantity,
                    quantity_unit=dem.quantity_unit,
                    distance_km=round(distance_km, 2),
                    name_similarity=round(effective_sim, 3),
                    match_score=round(match_score, 3),
                    score_breakdown=ScoreBreakdown(**score_detail["breakdown"]),
                    match_labels=MatchLabels(**score_detail["labels"]),
                    category_matched=cat_match,
                    org_email=org.email,
                    org_phone=org.phone_number,
                    org_address=org.address,
                    org_latitude=org.latitude,
                    org_longitude=org.longitude,
                ))
            except Exception as item_err:
                print(f"[Worker] Skipping candidate due to error: {item_err}")
                continue

        results.sort(key=lambda x: x.match_score, reverse=True)
        results = results[:settings.MAX_RESULTS]

        return MatchResponse(
            total_results=len(results),
            results=results,
            computed_at=datetime.utcnow().isoformat()
        )

    except Exception as e:
        print(f"[Worker] supply→demand matching error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/match/demand-to-supplies", response_model=MatchResponse, tags=["Matching"])
async def match_demand_to_supplies(request: MatchDemandRequest):
    """
    Compute matches: Demand → Supplies.
    Returns scored results with personalized breakdowns.
    """
    try:
        demand = request.demand
        demand_org = request.demand_org
        search_radius = request.search_radius
        results = []

        print(f"[Worker] Processing Demand→Supplies for Demand ID: {demand.demand_id}. "
              f"Candidates: {len(request.candidates)}. Radius: {search_radius}km")

        demand_text = build_rich_text(demand.item_name, demand.item_description, demand.item_category)

        for candidate in request.candidates:
            sup = candidate.supply
            org = candidate.org

            try:
                distance_km = calculate_distance(
                    demand_org.latitude, demand_org.longitude,
                    org.latitude, org.longitude
                )

                if distance_km > search_radius:
                    continue

                # Category match (same consistent logic)
                cat_match = check_category_match(
                    demand.category_id, sup.category_id,
                    demand.item_category, sup.item_category
                )

                # Build rich text
                supply_text = build_rich_text(sup.item_name, sup.item_description, sup.item_category)

                # Hybrid similarity
                try:
                    name_similarity = calculate_hybrid_similarity(
                        demand_text,
                        supply_text,
                        use_semantic=settings.USE_SEMANTIC_SEARCH,
                        semantic_weight=settings.SEMANTIC_WEIGHT,
                        fuzzy_weight=settings.FUZZY_WEIGHT
                    )
                except Exception as e:
                    print(f"[Worker] Similarity calc failed: {e}")
                    name_similarity = 0.0

                if not cat_match and name_similarity < settings.SIMILARITY_THRESHOLD:
                    continue

                # Category boost: moderate
                if cat_match:
                    effective_sim = max(name_similarity, 0.65)
                    effective_sim = min(1.0, effective_sim + 0.15)
                else:
                    effective_sim = name_similarity

                # Detailed score
                score_detail = calculate_match_score_detailed(
                    distance_km=distance_km,
                    similarity_score=effective_sim,
                    supply_price=sup.price_per_unit,
                    demand_max_price=demand.max_price_per_unit,
                    max_distance=search_radius,
                    supply_qty=sup.quantity,
                    supply_unit=sup.quantity_unit,
                    demand_qty=demand.quantity,
                    demand_unit=demand.quantity_unit,
                    price_tolerance=settings.PRICE_TOLERANCE_PERCENT
                )

                match_score = score_detail["match_score"]

                if match_score < MIN_MATCH_SCORE:
                    continue

                results.append(MatchResult(
                    id=sup.supply_id,
                    org_id=org.org_id,
                    org_name=org.org_name,
                    item_name=sup.item_name,
                    item_category=sup.item_category,
                    item_description=sup.item_description,
                    price=sup.price_per_unit,
                    currency=sup.currency,
                    quantity=sup.quantity,
                    quantity_unit=sup.quantity_unit,
                    distance_km=round(distance_km, 2),
                    name_similarity=round(effective_sim, 3),
                    match_score=round(match_score, 3),
                    score_breakdown=ScoreBreakdown(**score_detail["breakdown"]),
                    match_labels=MatchLabels(**score_detail["labels"]),
                    category_matched=cat_match,
                    org_email=org.email,
                    org_phone=org.phone_number,
                    org_address=org.address,
                    org_latitude=org.latitude,
                    org_longitude=org.longitude,
                ))
            except Exception as item_err:
                print(f"[Worker] Skipping candidate due to error: {item_err}")
                continue

        results.sort(key=lambda x: x.match_score, reverse=True)
        results = results[:settings.MAX_RESULTS]

        return MatchResponse(
            total_results=len(results),
            results=results,
            computed_at=datetime.utcnow().isoformat()
        )

    except Exception as e:
        print(f"[Worker] demand→supply matching error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_DEBUG,
    )
