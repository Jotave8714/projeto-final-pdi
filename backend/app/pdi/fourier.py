"""Filtro de Fourier (notch) para ruído periódico em colunas.

Digitalizações e simulações podem trazer um padrão periódico de listras
verticais. Sozinho ele é quase invisível, mas o CLAHE e a equalização o
amplificam até virar listras pretas na saída. No domínio da frequência esse
padrão aparece como colunas anormalmente fortes do espectro (fx fixo, todo fy).

Método: FFT 2D; para cada coluna de frequência mede-se a média do espectro de
magnitude (log) em relação ao seu entorno suavizado; colunas cujo escore robusto
(mediana/MAD) passa de ``z_min``, fora da banda central (conteúdo do texto), são
zeradas com uma faixa estreita; FFT inversa. Se nenhuma coluna se destaca, a
imagem volta sem alteração.

Limitações: trata apenas periodicidade em colunas (listras verticais); remove
também a pequena parcela de energia do texto naquelas frequências; ruído sem
periodicidade (grão, manchas) não é afetado. Não há eficácia comprovada além
das amostras testadas.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class ParametrosFourier:
    z_min: float
    banda_central_frac: float
    meia_largura: int
    frequencias_removidas: tuple[int, ...]

    def como_dict(self) -> dict:
        return asdict(self)


def filtrar_fourier(
    cinza: np.ndarray,
    z_min: float = 8.0,
    banda_central_frac: float = 0.05,
    meia_largura: int = 3,
) -> tuple[np.ndarray, ParametrosFourier]:
    """Remove ruído periódico em colunas. Devolve nova matriz uint8 e os parâmetros usados."""
    if cinza.dtype != np.uint8 or cinza.ndim != 2:
        raise ValueError("Esperada matriz 2D uint8 em escala de cinza.")
    if z_min <= 0:
        raise ValueError("z_min deve ser > 0.")
    if not 0 <= banda_central_frac < 0.5:
        raise ValueError("banda_central_frac deve estar em [0, 0.5).")
    if meia_largura < 0:
        raise ValueError("meia_largura deve ser >= 0.")

    _, largura = cinza.shape
    espectro = np.fft.fftshift(np.fft.fft2(cinza.astype(np.float64)))
    magnitude = np.log1p(np.abs(espectro)).astype(np.float32)
    destaque = magnitude - cv2.GaussianBlur(magnitude, (0, 0), 10)
    por_coluna = destaque.mean(axis=0)
    mediana = np.median(por_coluna)
    mad = np.median(np.abs(por_coluna - mediana)) * 1.4826
    z = (por_coluna - mediana) / max(float(mad), 1e-6)

    freq = np.arange(largura) - largura // 2
    alvo = (z > z_min) & (np.abs(freq) > banda_central_frac * largura)
    params = ParametrosFourier(
        float(z_min), float(banda_central_frac), int(meia_largura), tuple(int(f) for f in freq[alvo])
    )
    if not alvo.any():
        return cinza.copy(), params

    mascara = np.ones(largura, dtype=np.float32)
    for x in np.nonzero(alvo)[0]:
        mascara[max(0, x - meia_largura) : x + meia_largura + 1] = 0.0
    mascara = cv2.GaussianBlur(mascara.reshape(1, -1), (0, 0), 1.5).reshape(-1)

    saida = np.fft.ifft2(np.fft.ifftshift(espectro * mascara[None, :])).real
    return np.clip(np.rint(saida), 0, 255).astype(np.uint8), params
