"""CLAHE em escala de cinza (issue #10)."""

from __future__ import annotations

from dataclasses import asdict, dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class ParametrosCLAHE:
    clip_limit: float
    tile_grid_size: tuple[int, int]

    def como_dict(self) -> dict:
        return asdict(self)


def aplicar_clahe(
    cinza: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple[int, int] = (8, 8)
) -> tuple[np.ndarray, ParametrosCLAHE]:
    """CLAHE (OpenCV) sobre imagem cinza uint8.

    Devolve nova matriz e os parâmetros usados (clipLimit e tileGridSize), para
    registro. Valores padrão são apenas ponto de partida; os parâmetros finais
    devem ser escolhidos somente no conjunto de ajuste. Pode realçar a textura
    do papel e ruído; avaliar visualmente.
    """
    if cinza.dtype != np.uint8 or cinza.ndim != 2:
        raise ValueError("Esperada matriz 2D uint8 em escala de cinza.")
    if clip_limit <= 0:
        raise ValueError("clip_limit deve ser > 0.")
    if len(tile_grid_size) != 2 or min(tile_grid_size) < 1:
        raise ValueError("tile_grid_size deve ser (linhas, colunas) com valores >= 1.")
    tiles = (int(tile_grid_size[0]), int(tile_grid_size[1]))
    clahe = cv2.createCLAHE(clipLimit=float(clip_limit), tileGridSize=tiles)
    return clahe.apply(cinza), ParametrosCLAHE(float(clip_limit), tiles)
