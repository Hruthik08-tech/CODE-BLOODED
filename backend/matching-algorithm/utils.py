# Used for calculation of the score 

import math
import re
from typing import Tuple, Set
import Levenshtein


# ═══════════════════════════════════════════════════════════════
# Text Normalization & Tokenization
# ═══════════════════════════════════════════════════════════════

# Common stop words to ignore during token matching
STOP_WORDS = frozenset({
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'it', 'its',
    'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she',
    'they', 'me', 'us', 'him', 'her', 'them', 'my', 'our', 'your',
    'his', 'their', 'per', 'each', 'every', 'some', 'any', 'no', 'not',
    'all', 'both', 'few', 'more', 'most', 'other', 'such', 'only',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'about',
    'up', 'out', 'if', 'then', 'else', 'when', 'where', 'how', 'what',
    'which', 'who', 'whom', 'why', 'as', 'into',
    'need', 'needed', 'needs', 'want', 'wanted', 'require', 'required',
    'looking', 'seeking', 'available', 'supply', 'demand', 'item', 'items',
    'product', 'products', 'material', 'materials', 'high', 'quality',
    'good', 'best', 'new', 'used', 'fresh', 'bulk', 'wholesale',
})

# Synonym clusters for common supply-chain terms
SYNONYM_MAP = {}
_SYNONYM_CLUSTERS = [
    ['rice', 'basmati', 'paddy', 'grain rice'],
    ['wheat', 'flour', 'atta', 'maida'],
    ['steel', 'iron', 'metal', 'alloy'],
    ['wood', 'timber', 'lumber', 'plywood'],
    ['cement', 'concrete', 'morite'],
    ['pipe', 'pipes', 'piping', 'tube', 'tubes', 'tubing'],
    ['generator', 'generators', 'genset', 'power generator'],
    ['solar', 'photovoltaic', 'pv', 'solar panel', 'solar panels'],
    ['battery', 'batteries', 'cell', 'cells', 'accumulator'],
    ['medical', 'healthcare', 'pharma', 'pharmaceutical'],
    ['mask', 'masks', 'face mask', 'n95', 'surgical mask'],
    ['gloves', 'glove', 'hand gloves', 'latex gloves', 'nitrile gloves'],
    ['sanitizer', 'sanitiser', 'hand sanitizer', 'disinfectant'],
    ['tablet', 'tablets', 'pills', 'capsules', 'medicine'],
    ['cotton', 'fabric', 'textile', 'cloth'],
    ['oil', 'cooking oil', 'vegetable oil', 'edible oil'],
    ['sugar', 'jaggery', 'sweetener'],
    ['pulses', 'dal', 'lentils', 'beans', 'legumes'],
    ['fertilizer', 'fertiliser', 'manure', 'compost'],
    ['pesticide', 'insecticide', 'herbicide'],
    ['pump', 'pumps', 'motor pump', 'water pump'],
    ['wire', 'wires', 'cable', 'cables', 'wiring'],
    ['brick', 'bricks', 'block', 'blocks', 'cinder block'],
    ['plastic', 'polythene', 'polymer', 'pvc'],
    ['paper', 'cardboard', 'packaging'],
    ['tarpaulin', 'tarp', 'tarps', 'tent', 'tents', 'shelter'],
    ['blanket', 'blankets', 'bedding', 'quilt'],
    ['water', 'drinking water', 'purified water', 'clean water'],
    ['food', 'rations', 'food packets', 'mre'],
    ['kit', 'kits', 'set', 'sets', 'package', 'packages'],
]

for cluster in _SYNONYM_CLUSTERS:
    canonical = cluster[0]
    for word in cluster:
        SYNONYM_MAP[word.lower()] = canonical


def tokenize(text: str) -> Set[str]:
    """
    Tokenize and normalize text into a set of meaningful tokens.
    Removes stop words, lowercases, strips punctuation.
    """
    if not text:
        return set()
    
    # Lowercase and replace non-alphanumeric with spaces
    cleaned = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    tokens = cleaned.split()
    
    # Filter stop words and very short tokens
    meaningful = set()
    for t in tokens:
        t = t.strip()
        if len(t) < 2:
            continue
        if t in STOP_WORDS:
            continue
        # Map synonyms to canonical form
        canonical = SYNONYM_MAP.get(t, t)
        meaningful.add(canonical)
    
    return meaningful


def calculate_token_overlap(tokens1: Set[str], tokens2: Set[str]) -> float:
    """
    Calculate token overlap score between two token sets.
    Uses Jaccard-like metric but with weighting for partial matches.
    
    Returns: Score between 0 and 1
    """
    if not tokens1 or not tokens2:
        return 0.0
    
    # Direct token overlap
    exact_overlap = tokens1 & tokens2
    
    # Fuzzy token matching for remaining tokens
    remaining1 = tokens1 - exact_overlap
    remaining2 = tokens2 - exact_overlap
    
    fuzzy_matches = 0.0
    matched_from_2 = set()
    
    for t1 in remaining1:
        best_score = 0.0
        best_match = None
        for t2 in remaining2:
            if t2 in matched_from_2:
                continue
            # Check substring containment
            if t1 in t2 or t2 in t1:
                score = 0.85
            else:
                score = Levenshtein.ratio(t1, t2)
            
            if score > best_score and score >= 0.7:
                best_score = score
                best_match = t2
        
        if best_match:
            fuzzy_matches += best_score
            matched_from_2.add(best_match)
    
    total_matched = len(exact_overlap) + fuzzy_matches
    union_size = len(tokens1 | tokens2)
    
    if union_size == 0:
        return 0.0
    
    return min(1.0, total_matched / union_size)


# ═══════════════════════════════════════════════════════════════
# Distance Calculation
# ═══════════════════════════════════════════════════════════════

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on earth (in kilometers).
    Uses the Haversine formula.
    """
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    a = max(0.0, min(1.0, a))
    c = 2 * math.asin(math.sqrt(a))
    
    r = 6371  # Radius of earth in km
    return c * r


# ═══════════════════════════════════════════════════════════════
# String Similarity
# ═══════════════════════════════════════════════════════════════

def calculate_string_similarity(str1: str, str2: str) -> float:
    """
    Multi-strategy string similarity combining:
    1. Exact normalized match
    2. Levenshtein ratio
    3. Token overlap with synonym awareness
    4. Substring containment bonus
    
    Returns: Similarity score between 0 and 1
    """
    if not str1 or not str2:
        return 0.0
    
    s1 = str1.lower().strip()
    s2 = str2.lower().strip()
    
    # Exact match
    if s1 == s2:
        return 1.0
    
    # 1. Levenshtein ratio (good for typos)
    lev_score = Levenshtein.ratio(s1, s2)
    
    # 2. Token overlap (good for word reordering, synonym matching)
    tokens1 = tokenize(s1)
    tokens2 = tokenize(s2)
    token_score = calculate_token_overlap(tokens1, tokens2)
    
    # 3. Substring containment (one is part of the other)
    substring_score = 0.0
    if s1 in s2 or s2 in s1:
        shorter = min(len(s1), len(s2))
        longer = max(len(s1), len(s2))
        substring_score = shorter / longer if longer > 0 else 0.0
        substring_score = max(substring_score, 0.7)  # At least 0.7 if contained
    
    # Take the best of all strategies
    return max(lev_score, token_score, substring_score)


# ═══════════════════════════════════════════════════════════════
# Hybrid Similarity (Semantic + Fuzzy + Token)
# ═══════════════════════════════════════════════════════════════

def calculate_hybrid_similarity(
    str1: str,
    str2: str,
    use_semantic: bool = True,
    semantic_weight: float = 0.7,
    fuzzy_weight: float = 0.3
) -> float:
    """
    Calculate hybrid similarity combining semantic, fuzzy, and token matching.
    
    Strategy:
    1. Token-aware fuzzy matching (always)
    2. Semantic embedding similarity (if available)
    3. Weighted combination, never worse than fuzzy alone
    """
    # Enhanced fuzzy + token similarity
    fuzzy_sim = calculate_string_similarity(str1, str2)
    
    if not use_semantic:
        return fuzzy_sim
    
    try:
        from semantic_search import calculate_semantic_similarity
        semantic_sim = calculate_semantic_similarity(str1, str2)
        
        # Combine with weights
        combined = (semantic_sim * semantic_weight) + (fuzzy_sim * fuzzy_weight)
        
        # Never worse than fuzzy alone
        return max(combined, fuzzy_sim)
        
    except Exception as e:
        print(f"Semantic search not available, using enhanced fuzzy: {e}")
        return fuzzy_sim


# ═══════════════════════════════════════════════════════════════
# Quantity Normalization & Scoring
# ═══════════════════════════════════════════════════════════════

def normalize_quantity(qty: float, unit: str) -> float:
    """
    Normalize quantity to a base unit (kg for mass, l for volume).
    Returns raw qty if unit is unknown.
    """
    if qty is None or not unit:
        return qty
        
    u = unit.lower().strip().rstrip('s')
    
    # Mass (Base: kg)
    if u in ['kg', 'kilogram']: return qty
    if u in ['g', 'gram']: return qty / 1000.0
    if u in ['tonne', 'ton', 'metric ton']: return qty * 1000.0
    if u in ['mg', 'milligram']: return qty / 1000000.0
    
    # Volume (Base: l)
    if u in ['l', 'litre', 'liter']: return qty
    if u in ['ml', 'milliliter', 'millilitre']: return qty / 1000.0
    
    # Count/Other
    return qty


def are_units_comparable(unit1: str, unit2: str) -> bool:
    """Check if two units can be meaningfully compared."""
    if not unit1 or not unit2:
        return False
    
    u1 = unit1.lower().strip().rstrip('s')
    u2 = unit2.lower().strip().rstrip('s')
    
    if u1 == u2:
        return True
    
    mass_units = {'kg', 'g', 'tonne', 'ton', 'mg', 'kilogram', 'gram', 'milligram', 'metric ton'}
    volume_units = {'l', 'ml', 'litre', 'liter', 'milliliter', 'millilitre'}
    
    if u1 in mass_units and u2 in mass_units:
        return True
    if u1 in volume_units and u2 in volume_units:
        return True
    
    return False


# ═══════════════════════════════════════════════════════════════
# Match Score Calculation
# ═══════════════════════════════════════════════════════════════

def calculate_match_score(
    distance_km: float,
    similarity_score: float,
    supply_price: float,
    demand_max_price: float,
    max_distance: float,
    supply_qty: float = None,
    supply_unit: str = None,
    demand_qty: float = None,
    demand_unit: str = None,
    price_tolerance: float = 0.25
) -> float:
    """
    Calculate personalized match score with detailed breakdown.
    
    Returns a score between 0 and 1, combining:
    - Similarity (0.40 weight) — how well items match semantically
    - Distance  (0.20 weight) — proximity bonus
    - Price     (0.25 weight) — price compatibility
    - Quantity  (0.15 weight) — fulfillment capability
    """
    # 1. Distance Score (smooth exponential decay, not harsh linear)
    if max_distance <= 0:
        dist_score = 0.0
    else:
        ratio = distance_km / max_distance
        # Exponential decay: nearby = high score, far = low but not zero
        dist_score = math.exp(-2.0 * ratio)
        dist_score = max(0.0, min(1.0, dist_score))
    
    # 2. Similarity Score (passed 0-1)
    sim_score = max(0.0, min(1.0, similarity_score))
    
    # 3. Price Score (more forgiving with smooth curves)
    price_score = 0.0
    if demand_max_price is None or demand_max_price <= 0:
        price_score = 0.8  # Unknown budget = decent score
    elif supply_price is None or supply_price <= 0:
        price_score = 0.7  # Price not listed = assume negotiable
    else:
        if supply_price <= demand_max_price:
            # Under budget — great!
            savings_ratio = 1.0 - (supply_price / demand_max_price)
            if savings_ratio > 0.5:
                price_score = 0.95  # Very cheap, might be suspicious
            else:
                price_score = 1.0
        else:
            # Over budget — graceful decay
            overage_ratio = (supply_price - demand_max_price) / demand_max_price
            if overage_ratio <= price_tolerance:
                # Within tolerance: smooth decay from 1.0 to 0.6
                price_score = 1.0 - (0.4 * (overage_ratio / price_tolerance))
            elif overage_ratio <= price_tolerance * 2:
                # Within 2x tolerance: decay from 0.6 to 0.3
                excess = overage_ratio - price_tolerance
                price_score = 0.6 - (0.3 * (excess / price_tolerance))
            else:
                # Way over budget but still visible
                price_score = 0.15
    
    # 4. Quantity Score (actually compare quantities)
    qty_score = 0.5  # Default neutral
    
    if supply_qty is not None and demand_qty is not None and demand_qty > 0:
        if are_units_comparable(supply_unit, demand_unit):
            s_norm = normalize_quantity(supply_qty, supply_unit)
            d_norm = normalize_quantity(demand_qty, demand_unit)
            
            if s_norm is not None and d_norm is not None and d_norm > 0:
                fulfillment = s_norm / d_norm
                if fulfillment >= 1.0:
                    qty_score = 1.0  # Can fully fulfill
                elif fulfillment >= 0.8:
                    qty_score = 0.9  # Nearly full
                elif fulfillment >= 0.5:
                    qty_score = 0.75  # Partial but useful
                elif fulfillment >= 0.25:
                    qty_score = 0.5  # Low partial
                else:
                    qty_score = 0.3  # Very low
        elif supply_unit and demand_unit:
            # Different unit types — neutral
            qty_score = 0.5
    
    # Weighted combination
    # Similarity is king, followed by price and distance, then quantity
    overall = (
        sim_score  * 0.40 +
        price_score * 0.25 +
        dist_score * 0.20 +
        qty_score  * 0.15
    )
    
    return min(1.0, max(0.0, overall))


def calculate_match_score_detailed(
    distance_km: float,
    similarity_score: float,
    supply_price: float,
    demand_max_price: float,
    max_distance: float,
    supply_qty: float = None,
    supply_unit: str = None,
    demand_qty: float = None,
    demand_unit: str = None,
    price_tolerance: float = 0.25
) -> dict:
    """
    Same as calculate_match_score but returns a detailed breakdown 
    for the frontend to display personalized explanations.
    """
    # 1. Distance Score
    if max_distance <= 0:
        dist_score = 0.0
    else:
        ratio = distance_km / max_distance
        dist_score = math.exp(-2.0 * ratio)
        dist_score = max(0.0, min(1.0, dist_score))
    
    # 2. Similarity Score
    sim_score = max(0.0, min(1.0, similarity_score))
    
    # 3. Price Score
    price_score = 0.0
    price_label = "unknown"
    if demand_max_price is None or demand_max_price <= 0:
        price_score = 0.8
        price_label = "budget_unknown"
    elif supply_price is None or supply_price <= 0:
        price_score = 0.7
        price_label = "price_negotiable"
    else:
        if supply_price <= demand_max_price:
            savings_ratio = 1.0 - (supply_price / demand_max_price)
            if savings_ratio > 0.5:
                price_score = 0.95
                price_label = "very_affordable"
            elif savings_ratio > 0.2:
                price_score = 1.0
                price_label = "under_budget"
            else:
                price_score = 1.0
                price_label = "within_budget"
        else:
            overage_ratio = (supply_price - demand_max_price) / demand_max_price
            if overage_ratio <= price_tolerance:
                price_score = 1.0 - (0.4 * (overage_ratio / price_tolerance))
                price_label = "slightly_over"
            elif overage_ratio <= price_tolerance * 2:
                excess = overage_ratio - price_tolerance
                price_score = 0.6 - (0.3 * (excess / price_tolerance))
                price_label = "over_budget"
            else:
                price_score = 0.15
                price_label = "expensive"
    
    # 4. Quantity Score
    qty_score = 0.5
    qty_label = "unknown"
    fulfillment_pct = None
    
    if supply_qty is not None and demand_qty is not None and demand_qty > 0:
        if are_units_comparable(supply_unit, demand_unit):
            s_norm = normalize_quantity(supply_qty, supply_unit)
            d_norm = normalize_quantity(demand_qty, demand_unit)
            
            if s_norm is not None and d_norm is not None and d_norm > 0:
                fulfillment = s_norm / d_norm
                fulfillment_pct = round(min(fulfillment * 100, 100), 0)
                if fulfillment >= 1.0:
                    qty_score = 1.0
                    qty_label = "full_fulfillment"
                elif fulfillment >= 0.8:
                    qty_score = 0.9
                    qty_label = "near_full"
                elif fulfillment >= 0.5:
                    qty_score = 0.75
                    qty_label = "partial"
                elif fulfillment >= 0.25:
                    qty_score = 0.5
                    qty_label = "low_partial"
                else:
                    qty_score = 0.3
                    qty_label = "very_low"
        else:
            qty_label = "incompatible_units"
    
    # Overall
    overall = (
        sim_score  * 0.40 +
        price_score * 0.25 +
        dist_score * 0.20 +
        qty_score  * 0.15
    )
    overall = min(1.0, max(0.0, overall))
    
    return {
        "match_score": round(overall, 3),
        "breakdown": {
            "similarity": round(sim_score, 3),
            "distance": round(dist_score, 3),
            "price": round(price_score, 3),
            "quantity": round(qty_score, 3),
        },
        "labels": {
            "price": price_label,
            "quantity": qty_label,
            "fulfillment_pct": fulfillment_pct,
        },
        "weights": {
            "similarity": 0.40,
            "distance": 0.20,
            "price": 0.25,
            "quantity": 0.15,
        }
    }


def generate_cache_key(demand_id: int) -> str:
    return f"search_results:demand:{demand_id}"
