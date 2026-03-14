import re
from copy import deepcopy
from typing import Any, Dict


DEFAULT_RULES: Dict[str, Any] = {
    "underpricing_floors": [
        {"lt": 0.20, "prob": 0.99},
        {"lt": 0.35, "prob": 0.95},
        {"lt": 0.50, "prob": 0.85},
        {"lt": 0.70, "prob": 0.65},
    ],
    "description": {
        "weighted_patterns": {
            r"\b(no viewing|no visit|viewing not possible)\b": 0.30,
            r"\b(wire transfer|western union|crypto|bitcoin|gift card)\b": 0.35,
            r"\b(owner abroad|landlord abroad|currently overseas|outside the country|im outside|away from country)\b": 0.25,
            r"\b(urgent|act fast|only today|limited time)\b": 0.15,
            r"\b(too good to be true|half price|very cheap|low price)\b": 0.20,
            r"\b(send deposit first|deposit before viewing|deposit before visit|deposit before visiting|pay first)\b": 0.35,
            r"\b(online transfer|online payment|payment online)\b": 0.20,
        },
        "short_words_threshold": 8,
        "short_sales_pattern": r"\b(cheap|deal|urgent|fast)\b",
        "short_sales_bonus": 0.10,
        "sentence_min_words": 12,
        "repeat_ratio_threshold": 0.60,
        "repeat_words_cap": 20,
        "quality_score_short": 0.30,
        "quality_score_good": 0.12,
        "wording_scores": {
            "strong_combo": 0.88,
            "strong_single": 0.75,
            "medium_multi": 0.65,
            "medium_single": 0.55,
        },
        "short_with_keywords_min": 0.75,
        "short_with_keywords_boost": 0.10,
        "strong_terms": [
            r"\bno viewing\b",
            r"\bno visit\b",
            r"\bwire transfer\b",
            r"\bwestern union\b",
            r"\bcrypto\b",
            r"\bbitcoin\b",
            r"\bgift card\b",
            r"\bowner abroad\b",
            r"\boverseas\b",
            r"\boutside the country\b",
            r"\bim outside\b",
            r"\baway from (the )?country\b",
            r"\bdeposit before (viewing|visit|visiting)\b",
            r"\bsend deposit first\b",
            r"\bpay first\b",
        ],
        "medium_terms": [
            r"\bcheap\b",
            r"\blow price\b",
            r"\bhalf price\b",
            r"\bdeal\b",
            r"\burgent\b",
            r"\blimited time\b",
            r"\bact fast\b",
            r"\bonline (transfer|payment)\b",
            r"\bpayment online\b",
        ],
        "review_cues": {
            "negative": r"\b(scam|fake|fraud|no reply|did not return deposit|payment first)\b",
            "positive": r"\b(reliable|smooth|returned deposit|as described|professional)\b",
            "negative_bump": 0.08,
            "positive_bump": -0.05,
        },
    },
}

_runtime: Dict[str, Any] = {
    "desc_vectorizer": None,
    "desc_text_model": None,
    "rules": DEFAULT_RULES,
}


def _deep_merge_rules(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    merged = deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge_rules(merged[key], value)
        else:
            merged[key] = deepcopy(value)
    return merged


def set_runtime_context(desc_vectorizer=None, desc_text_model=None, runtime_rules=None) -> None:
    _runtime["desc_vectorizer"] = desc_vectorizer
    _runtime["desc_text_model"] = desc_text_model
    if isinstance(runtime_rules, dict) and runtime_rules:
        _runtime["rules"] = _deep_merge_rules(DEFAULT_RULES, runtime_rules)
    else:
        _runtime["rules"] = deepcopy(DEFAULT_RULES)


def underpricing_risk_floor(price_ratio: float) -> float:
    try:
        pr = float(price_ratio)
    except Exception:
        return 0.0
    if pr <= 0:
        return 0.0
    floors = _runtime["rules"].get("underpricing_floors", [])
    for row in floors:
        if pr < float(row.get("lt", -1)):
            return float(row.get("prob", 0.0))
    return 0.0


def _heuristic_description_score(text: str) -> float:
    text = (text or "").lower()
    if not text.strip():
        return 0.0

    cfg = _runtime["rules"].get("description", {})
    weighted_patterns = cfg.get("weighted_patterns", {})

    score = 0.0
    for pattern, weight in weighted_patterns.items():
        if re.search(pattern, text):
            score += float(weight)

    words = re.findall(r"\w+", text)
    if len(words) < int(cfg.get("short_words_threshold", 8)) and re.search(
        cfg.get("short_sales_pattern", r"\b(cheap|deal|urgent|fast)\b"),
        text,
    ):
        score += float(cfg.get("short_sales_bonus", 0.10))

    return float(min(1.0, score))


def _description_rule_based_score(description: str) -> float:
    text = (description or "").strip().lower()
    if not text:
        return 0.0

    cfg = _runtime["rules"].get("description", {})
    words = re.findall(r"\w+", text)
    word_count = len(words)
    unique_ratio = (len(set(words)) / max(1, word_count)) if word_count else 0.0

    has_sentence_punctuation = bool(re.search(r"[.!?]", text))
    is_short_or_incomplete = (
        word_count < int(cfg.get("sentence_min_words", 12))
        or not has_sentence_punctuation
        or (
            unique_ratio < float(cfg.get("repeat_ratio_threshold", 0.60))
            and word_count < int(cfg.get("repeat_words_cap", 20))
        )
    )

    strong_terms = cfg.get("strong_terms", [])
    medium_terms = cfg.get("medium_terms", [])
    strong_hits = sum(1 for p in strong_terms if re.search(p, text))
    medium_hits = sum(1 for p in medium_terms if re.search(p, text))
    has_scam_keywords = strong_hits > 0 or medium_hits > 0

    quality_score = float(
        cfg.get("quality_score_short", 0.50) if is_short_or_incomplete else cfg.get("quality_score_good", 0.12)
    )

    wording_cfg = cfg.get("wording_scores", {})
    if strong_hits >= 2 or (strong_hits >= 1 and medium_hits >= 1):
        wording_score = float(wording_cfg.get("strong_combo", 0.88))
    elif strong_hits == 1:
        wording_score = float(wording_cfg.get("strong_single", 0.75))
    elif medium_hits >= 2:
        wording_score = float(wording_cfg.get("medium_multi", 0.65))
    elif medium_hits == 1:
        wording_score = float(wording_cfg.get("medium_single", 0.55))
    else:
        wording_score = 0.0

    if is_short_or_incomplete and has_scam_keywords:
        return float(
            min(
                1.0,
                max(
                    wording_score + float(cfg.get("short_with_keywords_boost", 0.10)),
                    float(cfg.get("short_with_keywords_min", 0.75)),
                ),
            )
        )

    if wording_score > 0:
        return float(min(1.0, wording_score))

    return float(min(1.0, quality_score))


def _calibrate_description_model_score(raw_score: float, description: str, reviews: str) -> float:
    score = float(min(1.0, max(0.0, raw_score)))
    combined_text = f"{description or ''} {reviews or ''}".strip().lower()
    if not combined_text:
        return 0.0
    rule_score = _description_rule_based_score(description)
    return max(rule_score, score)


def compute_description_scam_score(description: str, reviews: str = "") -> float:
    description = description or ""
    reviews = reviews or ""

    desc_vectorizer = _runtime.get("desc_vectorizer")
    desc_text_model = _runtime.get("desc_text_model")

    if desc_vectorizer is not None and desc_text_model is not None:
        try:
            X_desc = desc_vectorizer.transform([description])
            desc_prob = float(desc_text_model.predict_proba(X_desc)[0][1])

            cues = _runtime["rules"].get("description", {}).get("review_cues", {})
            review_flag = 0.0
            if reviews.strip():
                if re.search(cues.get("negative", ""), reviews.lower()):
                    review_flag += float(cues.get("negative_bump", 0.08))
                if re.search(cues.get("positive", ""), reviews.lower()):
                    review_flag += float(cues.get("positive_bump", -0.05))

            raw_score = float(min(1.0, max(0.0, desc_prob + review_flag)))
            return _calibrate_description_model_score(raw_score, description, reviews)
        except Exception:
            pass

    return _description_rule_based_score(description)


def infer_risk_direction(name: str, value: float, is_new: bool) -> str:
    if name == "priceRatio":
        if value < 0.7 or value > 1.5:
            return "increases"
        if 0.9 <= value <= 1.05:
            return "decreases"
        return "increases"

    if name == "depositRatio":
        if value < 0.85 or value > 2.7:
            return "increases"
        if 1.0 <= value <= 2.5:
            return "decreases"
        return "neutral"

    if name == "reputationScore":
        if value < 40:
            return "increases"
        if value >= 50:
            return "decreases"
        return "neutral"

    if name == "nationalityMismatch":
        return "increases" if value >= 0.5 else "decreases"

    if name == "thumbsRatio":
        if is_new:
            return "neutral"
        if value < 0.4:
            return "increases"
        if value > 0.6:
            return "decreases"
        return "neutral"

    if name == "averageReviewRating":
        if is_new:
            return "neutral"
        if value < 2.8:
            return "increases"
        if value >= 4.0:
            return "decreases"
        return "neutral"

    if name == "descriptionScamScore":
        if value >= 0.45:
            return "increases"
        if value < 0.2:
            return "decreases"
        return "neutral"

    return "neutral"


def explanation_for_feature(name: str, value: float, direction: str, is_new: bool) -> str:
    semantic_direction = infer_risk_direction(name, value, is_new)
    direction = semantic_direction

    def direction_phrase(tag: str) -> str:
        if tag == "increases":
            return "increasing risk"
        if tag == "decreases":
            return "lowering risk"
        return "with neutral effect"

    if name == "priceRatio":
        if value < 0.5:
            return f"Price is far below market average ({value:.2f}x), {direction_phrase(direction)}"
        if value < 0.7:
            return f"Price is below market average ({value:.2f}x), {direction_phrase(direction)}"
        if value > 1.5:
            return f"Price is unusually above market average ({value:.2f}x), {direction_phrase(direction)}"
        if value < 0.9:
            return f"Price is below the safest market band ({value:.2f}x), {direction_phrase(direction)}"
        if value <= 1.05:
            return f"Price is within the safest market band ({value:.2f}x), {direction_phrase(direction)}"
        return f"Price is above the safest market band ({value:.2f}x), {direction_phrase(direction)}"

    if name == "depositRatio":
        if value > 3.0:
            return f"Deposit is extremely high ({value:.2f}x monthly market rent), {direction_phrase(direction)}"
        if value < 0.85:
            return f"Deposit is well below the normal range ({value:.2f}x monthly market rent), {direction_phrase(direction)}"
        if value < 1.0:
            return f"Deposit is slightly below the normal range ({value:.2f}x monthly market rent), {direction_phrase(direction)}"
        if value > 2.7:
            return f"Deposit is well above the normal range ({value:.2f}x monthly market rent), {direction_phrase(direction)}"
        if value > 2.5:
            return f"Deposit is slightly above the normal range ({value:.2f}x monthly market rent), {direction_phrase(direction)}"
        return f"Deposit level is within normal range ({value:.2f}x), {direction_phrase(direction)}"

    if name == "reputationScore":
        if value < 30:
            return f"Low landlord reputation score ({value:.0f}/100), {direction_phrase(direction)}"
        if value >= 50:
            return f"Landlord reputation is in a healthy range ({value:.0f}/100), {direction_phrase(direction)}"
        return f"Landlord reputation is borderline ({value:.0f}/100), {direction_phrase(direction)}"

    if name == "nationalityMismatch":
        return "Profile/location mismatch signal is present" if value >= 0.5 else "No nationality mismatch signal"

    if name == "thumbsRatio":
        if is_new:
            return "New listing, so thumbs ratio is treated as neutral"
        if value < 0.4:
            return f"Mostly negative reactions (positive ratio {value:.2f}), {direction_phrase(direction)}"
        if value > 0.6:
            return f"Mostly positive reactions (positive ratio {value:.2f}), {direction_phrase(direction)}"
        return f"Balanced reactions (positive ratio {value:.2f}, near 50/50), {direction_phrase(direction)}"

    if name == "averageReviewRating":
        if is_new:
            return "New listing, so rating is treated as neutral"
        if value < 2.5:
            return f"Low average rating ({value:.1f}/5), {direction_phrase(direction)}"
        if value >= 4.0:
            return f"Review rating is positive so far ({value:.1f}/5), {direction_phrase(direction)}"
        return f"Review rating is mixed ({value:.1f}/5), {direction_phrase(direction)}"

    if name == "descriptionScamScore":
        if value >= 0.70:
            return f"Description NLP scam score is high ({value:.2f}) - short text with scam keywords, {direction_phrase(direction)}"
        if value >= 0.45:
            return f"Description NLP score is moderate ({value:.2f}) - generic/brief wording with some caution signals, {direction_phrase(direction)}"
        return f"Description NLP scam score is normal ({value:.2f}), {direction_phrase(direction)}"

    return f"Feature value: {value}"
