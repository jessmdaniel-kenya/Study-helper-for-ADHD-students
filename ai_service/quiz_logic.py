import re
import math
from collections.abc import Mapping
from typing import Any

MAX_NOTES_CHARS = 20_000
MAX_SUMMARY_CHARS = 1_000_000
MAX_ANSWER_CHARS = 2_000
MAX_QUESTIONS_PER_BATCH = 12
MAX_SUMMARY_CHUNK_CHARS = 20_000
MAX_GENERATION_TOKENS = 8_192
ALLOWED_TYPES = {"flashcard", "mcq", "written"}
STOP_WORDS = {
    "about", "after", "again", "also", "among", "because", "been", "being", "between",
    "could", "during", "each", "from", "have", "into", "more", "most", "other", "over",
    "same", "some", "such", "than", "that", "their", "there", "these", "they", "this",
    "those", "through", "under", "very", "were", "which", "while", "with", "would",
    "your", "and", "are", "for", "not", "the", "was", "when", "where", "what", "then",
    "can", "will", "its", "has", "had", "but", "all", "any", "you", "use", "used",
}


def validate_quiz_request(body: Any) -> dict[str, Any]:
    if not isinstance(body, dict):
        raise ValueError("Request body must be an object.")
    mode = body.get("mode")
    if mode not in {"generate", "grade", "summarize"}:
        raise ValueError("Choose generate, grade, or summarize mode.")
    notes = body.get("notes")
    if not isinstance(notes, str) or not notes.strip():
        raise ValueError("Add study notes first.")
    notes_limit = MAX_SUMMARY_CHARS if mode == "summarize" else MAX_NOTES_CHARS
    if len(notes) > notes_limit:
        raise ValueError(f"Notes are too long; the limit is {notes_limit:,} characters.")

    result = dict(body)
    result["notes"] = notes.strip()
    provider = body.get("provider")
    if provider is not None:
        if not isinstance(provider, dict) or provider.get("id") != "nvidia":
            raise ValueError("Choose a supported AI provider.")
        if "apiKey" in provider or "model" in provider:
            raise ValueError("Provider keys and model settings are configured on the server.")
        result["provider"] = {"id": "nvidia"}

    if mode == "grade":
        for field in ("question", "reference", "answer"):
            value = body.get(field)
            if not isinstance(value, str) or len(value) > MAX_ANSWER_CHARS:
                raise ValueError(f"The {field} must be text no longer than {MAX_ANSWER_CHARS:,} characters.")
    elif mode == "generate":
        count = body.get("count", 8)
        if (
            isinstance(count, bool)
            or not isinstance(count, (int, float))
            or not math.isfinite(count)
            or int(count) != count
            or not 1 <= count <= MAX_QUESTIONS_PER_BATCH
        ):
            raise ValueError(f"Question count must be a whole number from 1 to {MAX_QUESTIONS_PER_BATCH} per batch.")
        types = body.get("types", ["mcq", "written"])
        if not isinstance(types, list) or not types or any(not isinstance(value, str) or value not in ALLOWED_TYPES for value in types):
            raise ValueError("Choose at least one supported question type.")
        result["count"] = int(count)
        result["types"] = list(dict.fromkeys(types))
    elif not provider:
        raise ValueError("Summaries require an AI provider.")
    return result


def normalize(text: str) -> str:
    folded = (text or "").replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", folded).strip().lower()


def sentences_from(notes: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", notes)) if len(part.strip()) >= 25]


def keywords_from(text: str) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z'-]{3,}", text)
    return list(dict.fromkeys(word for word in words if word.lower() not in STOP_WORDS))


def make_local_quiz(notes: str, count: int = 8, types: list[str] | None = None) -> dict[str, Any]:
    sentences = sentences_from(notes or "")
    questions: list[dict[str, Any]] = []
    all_words = keywords_from(" ".join(sentences))
    safe_types = list(dict.fromkeys(value for value in (types or ["mcq", "written"]) if value in ALLOWED_TYPES))
    if not safe_types:
        raise ValueError("Choose at least one supported question type.")

    for sentence in sentences:
        if len(questions) >= count:
            break
        terms = sorted(keywords_from(sentence), key=len, reverse=True)
        if not terms:
            continue
        term = terms[0]
        masked = re.sub(rf"\b{re.escape(term)}\b", "_____", sentence, count=1, flags=re.IGNORECASE)
        question_type = safe_types[len(questions) % len(safe_types)]
        options = None
        if question_type == "mcq":
            distractors = [word for word in all_words if word.lower() != term.lower() and not re.search(rf"\b{re.escape(word)}\b", sentence, re.IGNORECASE)][:3]
            if len(distractors) < 3:
                alternative = next((kind for kind in safe_types if kind != "mcq"), None)
                if alternative is None:
                    continue
                question_type = alternative
            else:
                options = sorted([term, *distractors], key=str.lower)
        if question_type == "flashcard":
            prompt = f"Explain {term} as it is used in your notes."
        elif question_type == "written":
            prompt = f"Explain this point in your own words: “{sentence}”"
        else:
            prompt = f"Complete the sentence from your notes: “{masked}”"
        question = {
            "type": question_type,
            "prompt": prompt,
            "answer": term if question_type == "mcq" else sentence,
            "explanation": sentence,
            "quote": sentence,
        }
        if question_type == "mcq":
            question["options"] = options
        questions.append(question)
    if not questions:
        raise ValueError("Add a few complete sentences so a local quiz can be made.")
    return {"questions": questions, "truncated": False, "mode": "local"}


def grade_locally(question: str, reference: str, answer: str) -> dict[str, str]:
    expected = {word.lower() for word in keywords_from(f"{question} {reference}")}
    submitted = {word.lower() for word in keywords_from(answer)}
    key_terms = [word for word in expected if len(word) >= 5]
    hits = sum(word in submitted for word in key_terms)
    ratio = hits / len(key_terms) if key_terms else 0
    verdict = "Got it" if ratio >= 0.6 else "Partly there" if ratio >= 0.25 else "Not yet"
    feedback = {
        "Got it": "Your answer includes the main ideas from the notes.",
        "Partly there": "You have part of the idea; compare your answer with the key points below.",
        "Not yet": "Try again by naming the key ideas from the notes.",
    }[verdict]
    return {"verdict": verdict, "feedback": feedback, "best_fit": reference}


def split_summary_source(source: str) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(source):
        end = min(start + MAX_SUMMARY_CHUNK_CHARS, len(source))
        if end < len(source):
            boundary = max(source.rfind("\n", start, end), source.rfind(" ", start, end), source.rfind("\t", start, end))
            if boundary > start:
                end = boundary
        chunk = source[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end
        while start < len(source) and source[start].isspace():
            start += 1
    return chunks


def filter_questions(output: Any, notes: str, count: int, types: list[str]) -> list[dict[str, Any]]:
    haystack = normalize(notes)
    seen_quotes: set[str] = set()
    raw = output.get("questions", []) if isinstance(output, Mapping) else []
    if not isinstance(raw, list):
        return []
    questions = []
    for question in raw:
        if not isinstance(question, dict) or question.get("type") not in types:
            continue
        required = [question.get(key) for key in ("prompt", "answer", "explanation", "quote")]
        if not all(isinstance(value, str) and value.strip() for value in required):
            continue
        prompt, answer, explanation, quote = required
        if len(prompt) > 2_000 or len(answer) > 2_000 or len(quote) > 2_000:
            continue
        normalized_quote = normalize(quote)
        if not normalized_quote or normalized_quote not in haystack or normalized_quote in seen_quotes:
            continue
        if question["type"] == "mcq":
            options = question.get("options")
            if not isinstance(options, list) or len(options) != 4 or not all(isinstance(option, str) and option.strip() for option in options) or answer not in options:
                continue
        accepted = {"type": question["type"], "prompt": prompt, "answer": answer, "explanation": explanation, "quote": quote}
        if question["type"] == "mcq":
            accepted["options"] = question["options"]
        questions.append(accepted)
        seen_quotes.add(normalized_quote)
        if len(questions) >= count:
            break
    return questions
