"""Equalização global de histograma (issue #9)."""

from __future__ import annotations

import cv2
import numpy as np


def equalizar_global(cinza: np.ndarray) -> np.ndarray:
    """Equalização global (OpenCV) aplicada diretamente à imagem em cinza.

    Não depende de outros métodos. Devolve nova matriz uint8; a entrada não é
    alterada. Em imagens muito concentradas ou ruidosas pode amplificar ruído e
    textura do papel e piorar o contraste local; avaliar caso a caso.
    """
    if cinza.dtype != np.uint8 or cinza.ndim != 2:
        raise ValueError("Esperada matriz 2D uint8 em escala de cinza.")
    return cv2.equalizeHist(cinza)
