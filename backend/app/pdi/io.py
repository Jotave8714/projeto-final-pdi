"""Leitura de imagens e conversão para escala de cinza de 8 bits.

Conversão para cinza: Pillow modo "L", com luminância
Y = 0,299 R + 0,587 G + 0,114 B (ITU-R 601). Como os três canais são
combinados em um único valor, texto cuja diferença de contraste em relação ao
fundo existe apenas em um canal (por exemplo, tinta avermelhada sobre papel
amarelado) pode ter o contraste reduzido na versão em cinza. Isso é uma
limitação conhecida da conversão, não uma medida de desempenho.
"""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

FORMATOS_ACEITOS = {"PNG", "JPEG"}


class ImagemInvalidaError(ValueError):
    """Arquivo ausente, corrompido ou em formato não suportado."""


def ler_imagem(origem: bytes | str | Path) -> np.ndarray:
    """Lê PNG/JPEG e devolve uma NOVA matriz uint8 (H, W) ou (H, W, 3) em RGB.

    O arquivo/bytes de origem nunca é modificado. Levanta ImagemInvalidaError
    para dados inválidos ou formatos diferentes de PNG/JPEG.
    """
    try:
        if isinstance(origem, (bytes, bytearray)):
            fonte = io.BytesIO(origem)
        else:
            fonte = open(origem, "rb")
        with fonte:
            with Image.open(fonte) as img:
                if img.format not in FORMATOS_ACEITOS:
                    raise ImagemInvalidaError(
                        f"Formato não suportado: {img.format!r}. Use PNG ou JPEG."
                    )
                img.load()
                if img.mode in ("L", "1", "I;16", "I", "F"):
                    cinza = img.convert("L")
                    return np.array(cinza, dtype=np.uint8)
                rgb = img.convert("RGB")
                return np.array(rgb, dtype=np.uint8)
    except ImagemInvalidaError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as exc:
        raise ImagemInvalidaError(f"Imagem inválida ou corrompida: {exc}") from exc


def para_cinza(imagem: np.ndarray) -> np.ndarray:
    """Converte (H, W) ou (H, W, 3) uint8 em matriz uint8 (H, W), sem alterar a entrada."""
    if imagem.dtype != np.uint8:
        raise ValueError("A imagem deve ser uint8.")
    if imagem.ndim == 2:
        return imagem.copy()
    if imagem.ndim == 3 and imagem.shape[2] == 3:
        return np.array(Image.fromarray(imagem, mode="RGB").convert("L"), dtype=np.uint8)
    raise ValueError(f"Formato de matriz não suportado: {imagem.shape}")


def codificar_png(imagem: np.ndarray) -> bytes:
    """Codifica uma matriz uint8 em bytes PNG (útil para API e testes)."""
    buf = io.BytesIO()
    Image.fromarray(imagem).save(buf, format="PNG")
    return buf.getvalue()
