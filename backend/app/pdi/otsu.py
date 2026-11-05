"""Limiarização de Otsu (issue #13, parte de código; experimental/opcional)."""

from __future__ import annotations

import cv2
import numpy as np


def limiarizar_otsu(cinza: np.ndarray) -> tuple[np.ndarray, int]:
    """Binariza com Otsu. Devolve (imagem 0/255 uint8, limiar escolhido).

    A saída binária pode apagar traços fracos. Manter ou descartar este método
    é decisão da equipe após comparação com amostras reais; a versão em cinza
    realçada deve continuar disponível.
    """
    if cinza.dtype != np.uint8 or cinza.ndim != 2:
        raise ValueError("Esperada matriz 2D uint8 em escala de cinza.")
    limiar, binaria = cv2.threshold(cinza, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binaria, int(limiar)
