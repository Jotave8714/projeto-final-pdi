"""Ajuste global de contraste (issue #8)."""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np


@dataclass(frozen=True)
class ParametrosContraste:
    """Parâmetros de g = alpha * f + beta, ou expansão de faixa."""

    metodo: str
    alpha: float | None = None
    beta: float | None = None
    minimo: int | None = None
    maximo: int | None = None

    def como_dict(self) -> dict:
        return asdict(self)


def ajustar_contraste(
    cinza: np.ndarray, alpha: float, beta: float = 0.0
) -> tuple[np.ndarray, ParametrosContraste]:
    """g = alpha * f + beta, arredondado e saturado em [0, 255].

    Devolve nova matriz uint8 e os parâmetros usados. A entrada não é alterada.
    """
    _validar(cinza)
    if alpha < 0:
        raise ValueError("alpha deve ser >= 0.")
    g = np.rint(alpha * cinza.astype(np.float64) + beta)
    return np.clip(g, 0, 255).astype(np.uint8), ParametrosContraste(
        "linear", alpha=float(alpha), beta=float(beta)
    )


def expandir_faixa(
    cinza: np.ndarray, percentil_inferior: float = 0.0, percentil_superior: float = 100.0
) -> tuple[np.ndarray, ParametrosContraste]:
    """Expansão de faixa: leva [p_inf, p_sup] da imagem para [0, 255] (com saturação).

    Com 0 e 100 usa mínimo e máximo reais. Se a faixa for degenerada
    (mínimo == máximo), devolve cópia sem alteração.
    """
    _validar(cinza)
    if not 0 <= percentil_inferior < percentil_superior <= 100:
        raise ValueError("Percentis devem satisfazer 0 <= inferior < superior <= 100.")
    lo = int(np.floor(np.percentile(cinza, percentil_inferior)))
    hi = int(np.ceil(np.percentile(cinza, percentil_superior)))
    params = ParametrosContraste("expansao_faixa", minimo=lo, maximo=hi)
    if hi <= lo:
        return cinza.copy(), params
    g = np.rint((cinza.astype(np.float64) - lo) * 255.0 / (hi - lo))
    return np.clip(g, 0, 255).astype(np.uint8), params


def _validar(cinza: np.ndarray) -> None:
    if cinza.dtype != np.uint8 or cinza.ndim != 2:
        raise ValueError("Esperada matriz 2D uint8 em escala de cinza.")
