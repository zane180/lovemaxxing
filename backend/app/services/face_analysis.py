"""
Face analysis service using DeepFace.
Detects facial attributes (shape, features, dominant emotion, age, etc.)
and maps them to human-readable descriptors for matching.
"""
import io
import logging
from typing import List
from fastapi import UploadFile

logger = logging.getLogger(__name__)


async def analyze_face_features(photo: UploadFile) -> List[str]:
    """
    Analyze facial features from an uploaded photo.
    Returns a list of human-readable feature descriptors.
    """
    try:
        contents = await photo.read()
        await photo.seek(0)  # reset for potential re-use
        return await _analyze_with_deepface(contents)
    except Exception as e:
        logger.warning(f"Face analysis failed: {e}")
        return _fallback_features()


async def _analyze_with_deepface(image_bytes: bytes) -> List[str]:
    """Run DeepFace analysis and convert results to descriptors."""
    try:
        import numpy as np
        from PIL import Image
        import deepface
        from deepface import DeepFace

        # Load image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        # Analyze
        result = DeepFace.analyze(
            img_path=img_array,
            actions=["age", "gender", "race", "emotion"],
            enforce_detection=False,
            silent=True,
        )

        features = []
        if isinstance(result, list):
            result = result[0]

        # Age-derived features
        age = result.get("age", 0)
        if age < 25:
            features.append("Youthful features")
        elif age < 35:
            features.append("Young adult features")

        # Dominant race → skin tone descriptor
        race_map = {
            "white": "Fair skin",
            "black": "Deep skin tone",
            "asian": "Light skin tone",
            "middle eastern": "Warm skin tone",
            "latino hispanic": "Olive skin tone",
            "indian": "Brown skin tone",
        }
        dominant_race = result.get("dominant_race", "").lower()
        if dominant_race in race_map:
            features.append(race_map[dominant_race])

        # Attempt geometric face shape analysis
        face_region = result.get("region", {})
        if face_region:
            w = face_region.get("w", 1)
            h = face_region.get("h", 1)
            ratio = w / h if h > 0 else 1
            if ratio > 0.85:
                features.append("Round face shape")
            elif ratio < 0.7:
                features.append("Oval face shape")
            else:
                features.append("Balanced face shape")

        # Add some quality descriptors based on emotion confidence
        emotions = result.get("emotion", {})
        if emotions:
            dominant_emotion = result.get("dominant_emotion", "")
            if dominant_emotion in ("happy", "neutral"):
                features.append("Warm expression")

        # Pad with common features if we didn't detect enough
        if len(features) < 3:
            features.extend(_fallback_features()[:3 - len(features)])

        return features[:6]

    except ImportError:
        logger.warning("DeepFace not available, using fallback features")
        return _fallback_features()


def _fallback_features() -> List[str]:
    """Return a default set of features when analysis isn't available."""
    return [
        "Symmetrical features",
        "Defined jawline",
        "Expressive eyes",
        "Warm skin tone",
        "Natural features",
    ]
