"""
Face analysis service using Claude's vision API.
Detects facial attributes and maps them to the exact feature descriptors
used in the matching engine and frontend constants.
"""
import base64
import json
import logging
from typing import List
from fastapi import UploadFile

logger = logging.getLogger(__name__)

# Must exactly match FACE_FEATURES in lib/constants.ts
VALID_FEATURES = [
    # Face Shape
    "Oval", "Round", "Square", "Heart", "Diamond", "Oblong",
    # Eyes
    "Almond eyes", "Doe eyes", "Hooded eyes", "Upturned eyes", "Deep-set", "Wide-set",
    # Jawline
    "Defined jawline", "Soft jaw", "Strong jaw", "Sharp chin",
    # Features
    "High cheekbones", "Full lips", "Thin lips", "Strong brows", "Freckles", "Dimples", "Button nose", "Aquiline nose",
    # Skin Tone
    "Fair", "Light", "Medium", "Olive", "Tan", "Brown", "Deep",
    # Build Indicators
    "Athletic", "Slim", "Curvy", "Petite", "Tall features",
]

FEATURE_LIST_TEXT = "\n".join(f"- {f}" for f in VALID_FEATURES)

ANALYSIS_PROMPT = f"""Analyze the facial features visible in this photo. Select only features that are clearly apparent.

Choose from this exact list only:
{FEATURE_LIST_TEXT}

Rules:
- Select exactly ONE face shape (Oval, Round, Square, Heart, Diamond, or Oblong)
- Select exactly ONE skin tone (Fair, Light, Medium, Olive, Tan, Brown, or Deep)
- Select 3-6 additional features from eyes, jawline, and features categories
- Only select features that are clearly visible — do not guess
- Return ONLY a JSON object, no other text: {{"features": ["Oval", "Fair", "Almond eyes", "Defined jawline"]}}
- Use the exact label text from the list above, character-for-character"""


async def analyze_face_features(photo: UploadFile) -> List[str]:
    try:
        contents = await photo.read()
        await photo.seek(0)
        return await _analyze_with_claude(contents)
    except Exception as e:
        logger.warning(f"Face analysis failed: {e}")
        return []


async def _analyze_with_claude(image_bytes: bytes) -> List[str]:
    try:
        import anthropic

        client = anthropic.Anthropic()

        image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        media_type = _detect_media_type(image_bytes)

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": ANALYSIS_PROMPT,
                        },
                    ],
                }
            ],
        )

        response_text = message.content[0].text.strip()

        # Extract JSON from response
        start = response_text.index("{")
        end = response_text.rindex("}") + 1
        data = json.loads(response_text[start:end])
        features = data.get("features", [])

        # Only return labels that exist in our valid set
        valid = [f for f in features if f in VALID_FEATURES][:8]
        logger.info(f"Face analysis result: {valid}")
        return valid

    except ImportError:
        logger.error("anthropic package not installed — add it to requirements.txt")
        return []
    except Exception as e:
        logger.warning(f"Claude face analysis failed: {e}")
        return []


def _detect_media_type(image_bytes: bytes) -> str:
    if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
        return "image/webp"
    if image_bytes[:3] == b"GIF":
        return "image/gif"
    return "image/jpeg"
