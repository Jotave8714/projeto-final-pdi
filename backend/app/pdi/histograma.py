"""Histograma de intensidades 0-255 e visualizações rotuladas."""

from __future__ import annotations

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402


def calcular_histograma(cinza: np.ndarray) -> np.ndarray:
    """Contagem de pixels para cada intensidade 0..255 (vetor int64 de tamanho 256)."""
    if cinza.dtype != np.uint8 or cinza.ndim != 2:
        raise ValueError("Esperada matriz 2D uint8 em escala de cinza.")
    return np.bincount(cinza.ravel(), minlength=256).astype(np.int64)


def figura_comparacao(
    imagens: dict[str, np.ndarray], titulo: str | None = None
) -> plt.Figure:
    """Figura com uma coluna por imagem: imagem (mesma escala 0-255) e histograma rotulado.

    `imagens` mapeia rótulo -> matriz cinza uint8. Todas usam vmin=0, vmax=255
    para exibição comparável.
    """
    if not imagens:
        raise ValueError("Nenhuma imagem informada.")
    n = len(imagens)
    fig, eixos = plt.subplots(2, n, figsize=(4 * n, 6), squeeze=False)
    for col, (rotulo, cinza) in enumerate(imagens.items()):
        eixos[0][col].imshow(cinza, cmap="gray", vmin=0, vmax=255)
        eixos[0][col].set_title(rotulo)
        eixos[0][col].axis("off")
        hist = calcular_histograma(cinza)
        eixos[1][col].bar(np.arange(256), hist, width=1.0, color="0.3")
        eixos[1][col].set_xlim(0, 255)
        eixos[1][col].set_xlabel("Intensidade (0-255)")
        eixos[1][col].set_ylabel("Nº de pixels")
        eixos[1][col].set_title(f"Histograma - {rotulo}")
    if titulo:
        fig.suptitle(titulo)
    fig.tight_layout()
    return fig
