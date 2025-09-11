# chat.py
import os
import json
import pathlib
from typing import Any, Tuple
import cohere

# ---- Config ----
COHERE_API_KEY = "riyXcV8DUJGIskppNKAW9wtAg1MK21PixI3kOiSs"
if not COHERE_API_KEY:
    raise RuntimeError("Set COHERE_API_KEY in your environment")

DATA_DIR = pathlib.Path(os.getenv("PROCESSED_FILES_DIR", "./processed_files")).resolve()

co = cohere.ClientV2(api_key=COHERE_API_KEY)

# ---- File loading helpers ----
def _format_context(file_data: Any) -> str:
    LIMIT = 100_000
    if isinstance(file_data, (dict, list)):
        s = json.dumps(file_data, indent=2)
        return s[:LIMIT]
    if isinstance(file_data, bytes):
        s = file_data.decode("utf-8", errors="ignore")
        return s[:LIMIT]
    if isinstance(file_data, str):
        return file_data[:LIMIT]
    try:
        return json.dumps(file_data, default=str)[:LIMIT]
    except Exception:
        return str(file_data)[:LIMIT]

def load_processed_file(file_id: str) -> Tuple[Any, str]:
    for ext in (".json", ".csv", ".txt"):
        path = DATA_DIR / f"{file_id}{ext}"
        if path.exists():
            if ext == ".json":
                with path.open("r", encoding="utf-8") as f:
                    return json.load(f), path.name
            if ext == ".csv":
                import pandas as pd
                df = pd.read_csv(path)
                return json.loads(df.to_json(orient="records")), path.name
            if ext == ".txt":
                return path.read_text(encoding="utf-8", errors="ignore"), path.name
    raise FileNotFoundError(f"No processed file found for id '{file_id}' in {DATA_DIR}")

# ---- Detect general messages ----
GENERAL_GREETINGS = ["hello", "hi", "hey", "how are you", "thanks", "thank you", "good morning", "good evening"]

def is_general_message(msg: str) -> bool:
    msg_lower = msg.lower()
    return any(greet in msg_lower for greet in GENERAL_GREETINGS)

# ---- LLM call ----
def answer_question(file_data: Any, question: str) -> str:
    """
    Ask Cohere using the processed file content only for relevant data questions.
    Generic messages like greetings are answered without file context.
    Data questions are answered concisely (final answer in one line if possible).
    """
    if is_general_message(question):
        # Minimal prompt for general messages
        system_prompt = "You are a friendly AI assistant. Respond naturally and politely."
        user_content = question
    else:
        # Include file context for data questions
        context = _format_context(file_data)
        system_prompt = (
            "You are a data analysis assistant. "
            "Use only the provided context to answer. "
            "Provide a brief reasoning first, then a concise final answer, preferably in one line."
        )
        user_content = (
            f"Here is the processed file content:\n{context}\n\n"
            f"Question: {question}\n"
        )

    resp = co.chat(
        model="command-r-08-2024",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
    )

    return "".join(part.text for part in resp.message.content)
