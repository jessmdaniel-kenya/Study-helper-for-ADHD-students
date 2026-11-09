import re

MAX_CLASSIFIER_TEXT_CHARS = 2_000
MAX_EVIDENCE_ITEMS = 5
MAX_EVIDENCE_CHARS = 80

CRISIS_PATTERNS = [
    r"\b(?:kill|killing|killed)\s+(?:myself|my\s+self)\b",
    r"\bsuicid(?:e|al|ality)\b",
    r"\bself[-\s]?harm(?:ing|ed)?\b",
    r"\b(?:hurt|hurting|cut|cutting|harm|harming)\s+(?:myself|my\s+self)\b",
    r"\b(?:want|wants|wanted|wanting|wanna)\s+to\s+die\b",
    r"\b(?:end|ending|take|taking)\s+my\s+(?:own\s+)?life\b",
    r"\bbetter\s+off\s+(?:dead|without\s+me)\b",
    r"\b(?:don'?t|do\s+not)\s+want\s+to\s+(?:live|be\s+here|exist)\b",
    r"\bno\s+(?:reason|point)\s+(?:to|in)\s+(?:living|going\s+on)\b",
    r"\bnot\s+worth\s+living\b",
    r"\boverdos(?:e|ed|ing)\b",
]
SELF_CRITICAL_PATTERNS = [
    r"\bi'?m\s+(?:so\s+|really\s+|such\s+a\s+|a\s+|an\s+)?(?:stupid|dumb|idiot|worthless|useless|pathetic|failure|hopeless|disgusting|ugly|a\s+burden|a\s+mess)\b",
    r"\bi\s+hate\s+(?:myself|my\s+life|me)\b",
    r"\bi\s+can'?t\s+do\s+anything\s+right\b",
    r"\bi'?m\s+(?:not\s+)?good\s+enough\b",
    r"\bi'?m\s+not\s+good\s+at\s+(?:anything|this)\b",
    r"\bi\s+always\s+(?:mess|screw|ruin|fail)\b",
    r"\bnobody\s+(?:likes|cares\s+about)\s+me\b",
    r"\bi\s+(?:am|'m)\s+a\s+disappointment\b",
]
HOSTILITY_PATTERNS = [
    r"\b(?:you|they|he|she)\s*(?:'re|are|is)?\s*(?:so\s+|such\s+a\s+|a\s+|just\s+a\s+)?(?:stupid|dumb|idiots?|losers?|worthless|pathetic|useless|trash|garbage|morons?|clowns?|freaks?)\b",
    r"\bshut\s+up\b",
    r"\bgo\s+(?:to\s+hell|die)\b",
    r"\byou\s+suck\b",
    r"\bnobody\s+(?:wants|likes)\s+you\b",
    r"\byou\s+are\s+the\s+worst\b",
]
UNSOLICITED_ADVICE_PATTERNS = [
    r"\byou\s+(?:should|need\s+to|have\s+to|must|ought\s+to)\b",
    r"\bwhy\s+don'?t\s+you\b",
    r"\bif\s+i\s+were\s+you\b",
    r"\byou\s+just\s+need\s+to\b",
    r"\bjust\s+(?:try|focus|relax|calm\s+down|get\s+over\s+it|do\s+it|stop)\b",
    r"\bget\s+over\s+it\b",
]
RULES = [
    ("crisis", CRISIS_PATTERNS),
    ("self_critical", SELF_CRITICAL_PATTERNS),
    ("hostility", HOSTILITY_PATTERNS),
    ("unsolicited_advice", UNSOLICITED_ADVICE_PATTERNS),
]
ACTIONS = {
    "crisis": "show_crisis_resources",
    "self_critical": "offer_support",
    "hostility": "review_community_guidelines",
    "unsolicited_advice": "soften_wording",
}
MESSAGES = {
    "crisis": "It sounds like things may be really hard right now. If you are in immediate danger, contact your local emergency number or a crisis line in your country, and reach out to someone you trust. You are not alone, and support is available.",
    "self_critical": "Try to be as kind to yourself as you would be to a friend. If these feelings are heavy, consider talking to someone you trust.",
    "hostility": "This may come across as hostile. Consider rephrasing so the other person feels respected.",
    "unsolicited_advice": "This reads as advice the other person did not ask for. Consider asking what would help first.",
    "none": "No safety concerns detected.",
}
SEVERITIES = {"crisis": "crisis", "self_critical": "concern", "hostility": "concern", "unsolicited_advice": "low", "none": "none"}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("‘", "'").replace("’", "'").replace("ʼ", "'").replace("“", '"').replace("”", '"').replace("–", " ").replace("—", " ").replace("\u200b", "").replace("\u200c", "").replace("\u200d", "").replace("\ufeff", "")).strip().lower()


def classify_text(raw_text: str) -> dict:
    text = normalize_text(raw_text)
    flags = {name: False for name, _patterns in RULES}
    evidence: list[str] = []
    leading = "none"
    for name, patterns in RULES:
        matches = []
        for source in patterns:
            match = re.search(source, text)
            if match:
                phrase = re.sub(r"\s+", " ", match.group(0)).strip()[:MAX_EVIDENCE_CHARS]
                if phrase:
                    matches.append(phrase)
        if matches:
            flags[name] = True
            if leading == "none":
                leading = name
            evidence.extend(matches)
    unique_evidence = list(dict.fromkeys(evidence))[:MAX_EVIDENCE_ITEMS]
    flagged = leading != "none"
    return {
        "flagged": flagged,
        "flags": flags,
        "severity": SEVERITIES[leading],
        "action": ACTIONS.get(leading, "none"),
        "evidence": unique_evidence,
        "message": MESSAGES[leading],
    }
