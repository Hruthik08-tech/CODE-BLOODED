"""
Matching Worker — A pure computation microservice.

This worker does NOT:
  - Manage cache (Redis)
  - Perform CRUD operations
  - Access the database directly

It ONLY:
  - Receives supply/demand data via HTTP from the Node.js server
  - Computes match scores using semantic + fuzzy matching
  - Returns scored results back to the server

Architecture:
  Frontend → nginx → Node.js Server → [Cache check] → Matching Worker
                                                     ↓
                                              Store in Cache
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from utils import (
    calculate_distance,
    calculate_hybrid_similarity,
    calculate_match_score,
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
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# Request/Response schemas (worker-specific, inline)
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
    """
    Server sends: the supply, its org, and all candidate demands with their orgs.
    Worker computes scores and returns ranked results.
    """
    class Candidate(BaseModel):
        demand: DemandData
        org: OrgData

    supply: SupplyData
    supply_org: OrgData
    search_radius: float = 50.0
    candidates: List[Candidate]


class MatchDemandRequest(BaseModel):
    """
    Server sends: the demand, its org, and all candidate supplies with their orgs.
    Worker computes scores and returns ranked results.
    """
    class Candidate(BaseModel):
        supply: SupplyData
        org: OrgData

    demand: DemandData
    demand_org: OrgData
    search_radius: float = 50.0
    candidates: List[Candidate]


class MatchResult(BaseModel):
    """A single scored match result"""
    id: int                   # supply_id or demand_id
    org_id: int
    org_name: str
    item_name: str
    item_category: Optional[str] = None
    item_description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[float] = None
    quantity_unit: Optional[str] = None
    distance_km: float
    name_similarity: float
    match_score: float
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
# Endpoints
# ═══════════════════════════════════════════════════════════════

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Matching Worker",
        "version": "2.0.0",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/match/supply-to-demands", response_model=MatchResponse, tags=["Matching"])
async def match_supply_to_demands(request: MatchSupplyRequest):
    """
    Compute matches: Supply → Demands.

    The Node.js server sends:
    - The supply item + its org
    - All candidate demands + their orgs (pre-fetched from DB)
    - The search radius

    This worker computes distance, name similarity, price match,
    and overall score for each candidate.
    """
    try:
        supply = request.supply
        supply_org = request.supply_org
        search_radius = request.search_radius
        results = []

        print(f"[Worker] Processing match request for Supply ID: {supply.supply_id}. Candidates: {len(request.candidates)}. Radius: {search_radius}")

        for candidate in request.candidates:
            dem = candidate.demand
            org = candidate.org

            try:
                # Calculate distance
                distance_km = calculate_distance(
                    supply_org.latitude, supply_org.longitude,
                    org.latitude, org.longitude
                )

                # Filter by search radius
                if distance_km > search_radius:
                    # print(f"[Worker] Skipping Demand ID {dem.demand_id} due to distance: {distance_km:.2f}km > {search_radius}km")
                    continue

                # Category match: Strict ID match preferred, fallback to string match
                cat_match = False
                if supply.category_id is not None and dem.category_id is not None:
                    cat_match = (supply.category_id == dem.category_id)
                
                # If IDs missing or not matching, try string fallback (e.g. "Grains" vs "Grains & Flour")
                if not cat_match:
                    supply_cat = (supply.item_category or "").lower()
                    demand_cat = (dem.item_category or "").lower()
                    if supply_cat and demand_cat:
                        cat_match = supply_cat == demand_cat or supply_cat in demand_cat or demand_cat in supply_cat

                # Construct rich text for semantic search (Name + Desc + Category Name as fallback)
                # We use the raw category string if available to give context
                supply_text = f"{supply.item_name} {supply.item_description or ''} {supply.item_category or ''}".strip()
                demand_text = f"{dem.item_name} {dem.item_description or ''} {dem.item_category or ''}".strip()

                # Name similarity using hybrid semantic + fuzzy
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

                # Skip if neither category nor name matches well
                if not cat_match and name_similarity < settings.SIMILARITY_THRESHOLD:
                    # print(f"[Worker] Skipping Demand ID {dem.demand_id} due to low similarity: {name_similarity:.2f} < {settings.SIMILARITY_THRESHOLD}")
                    continue

                # Boost similarity if category matches
                effective_sim = max(name_similarity, 0.9) if cat_match else name_similarity

                # Overall match score with flexible price logic
                match_score = calculate_match_score(
                    distance_km=distance_km,
                    similarity_score=effective_sim,
                    supply_price=supply.price_per_unit,
                    demand_max_price=dem.max_price_per_unit,
                    max_distance=search_radius,
                    price_tolerance=settings.PRICE_TOLERANCE_PERCENT
                )
                
                # Only return if the score is decent (e.g. > 0.4)
                if match_score < 0.4:
                    continue

                results.append(MatchResult(
                    id=dem.demand_id,
                    org_id=org.org_id,
                    org_name=org.org_name,
                    item_name=dem.item_name,
                    item_category=dem.item_category,
                    item_description=dem.item_description,
                    price=dem.max_price_per_unit, # Return demand's max price as reference
                    quantity=dem.quantity,
                    quantity_unit=dem.quantity_unit,
                    distance_km=round(distance_km, 2),
                    name_similarity=round(effective_sim, 2), # Return raw sim
                    match_score=round(match_score, 2),
                    org_email=org.email,
                    org_phone=org.phone_number,
                    org_address=org.address,
                    org_latitude=org.latitude,
                    org_longitude=org.longitude,
                ))
            except Exception as item_err:
                print(f"[Worker] Skipping candidate due to error: {item_err}")
                continue

        # Sort by match score (descending), limit results
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

    The Node.js server sends:
    - The demand item + its org
    - All candidate supplies + their orgs (pre-fetched from DB)
    - The search radius

    This worker computes distance, name similarity, price match,
    and overall score for each candidate.
    """
    try:
        demand = request.demand
        demand_org = request.demand_org
        search_radius = request.search_radius
        results = []

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

                cat_match = False
                if demand.category_id is not None and sup.category_id is not None:
                    cat_match = (demand.category_id == sup.category_id)
                
                if not cat_match:
                    demand_cat = (demand.item_category or "").lower()
                    supply_cat = (sup.item_category or "").lower()
                    cat_match = demand_cat == supply_cat and demand_cat != ""

                # Construct rich text for semantic search
                demand_text = f"{demand.item_name} {demand.item_description or ''} {demand.item_category or ''}".strip()
                supply_text = f"{sup.item_name} {sup.item_description or ''} {sup.item_category or ''}".strip()

                name_similarity = calculate_hybrid_similarity(
                    demand_text,
                    supply_text,
                    use_semantic=settings.USE_SEMANTIC_SEARCH,
                    semantic_weight=settings.SEMANTIC_WEIGHT,
                    fuzzy_weight=settings.FUZZY_WEIGHT
                )

                if not cat_match and name_similarity < settings.SIMILARITY_THRESHOLD:
                    continue

                effective_sim = max(name_similarity, 0.9) if cat_match else name_similarity

                match_score = calculate_match_score(
                    distance_km=distance_km,
                    similarity_score=effective_sim,
                    supply_price=sup.price_per_unit,
                    demand_max_price=demand.max_price_per_unit,
                    max_distance=search_radius,
                    price_tolerance=settings.PRICE_TOLERANCE_PERCENT
                )

                if match_score < 0.4:
                    continue

                results.append(MatchResult(
                    id=sup.supply_id,
                    org_id=org.org_id,
                    org_name=org.org_name,
                    item_name=sup.item_name,
                    item_category=sup.item_category,
                    item_description=sup.item_description,
                    price=sup.price_per_unit,
                    quantity=sup.quantity,
                    quantity_unit=sup.quantity_unit,
                    distance_km=round(distance_km, 2),
                    name_similarity=round(effective_sim, 2),
                    match_score=round(match_score, 2),
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
