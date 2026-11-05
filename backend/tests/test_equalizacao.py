import numpy as np
import pytest

from app.pdi.equalizacao import equalizar_global
from app.pdi.histograma import calcular_histograma


def test_formato_e_dtype_preservados():
    f = np.random.default_rng(0).integers(100, 140, (20, 30), dtype=np.uint8)
    g = equalizar_global(f)
    assert g.shape == f.shape and g.dtype == np.uint8


def test_nao_altera_entrada():
    f = np.random.default_rng(1).integers(100, 140, (10, 10), dtype=np.uint8)
    antes = f.copy()
    equalizar_global(f)
    assert (f == antes).all()


def test_amplia_faixa_de_baixo_contraste():
    f = np.tile(np.arange(100, 120, dtype=np.uint8), (20, 1))
    g = equalizar_global(f)
    assert int(g.max()) - int(g.min()) > int(f.max()) - int(f.min())
    assert g.max() == 255


def test_imagem_constante_e_deterministica():
    f = np.full((5, 5), 77, dtype=np.uint8)
    g1, g2 = equalizar_global(f), equalizar_global(f)
    assert (g1 == g2).all()


def test_ordem_das_intensidades_preservada():
    f = np.tile(np.arange(50, 70, dtype=np.uint8), (10, 1))
    g = equalizar_global(f)
    assert (np.diff(g[0].astype(int)) >= 0).all()


def test_histograma_saida_soma_total():
    f = np.random.default_rng(2).integers(0, 60, (16, 16), dtype=np.uint8)
    assert calcular_histograma(equalizar_global(f)).sum() == f.size


def test_entrada_invalida():
    with pytest.raises(ValueError):
        equalizar_global(np.zeros((4, 4, 3), dtype=np.uint8))
