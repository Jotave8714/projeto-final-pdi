import numpy as np
import pytest

from app.pdi.contraste import ajustar_contraste, expandir_faixa


def test_linear_valores_conhecidos():
    f = np.array([[0, 100, 200]], dtype=np.uint8)
    g, p = ajustar_contraste(f, alpha=1.5, beta=10)
    assert g.tolist() == [[10, 160, 255]]  # 310 satura em 255
    assert p.alpha == 1.5 and p.beta == 10 and p.metodo == "linear"


def test_saturacao_inferior():
    f = np.array([[0, 10, 100]], dtype=np.uint8)
    g, _ = ajustar_contraste(f, alpha=1.0, beta=-50)
    assert g.tolist() == [[0, 0, 50]]


def test_nao_altera_entrada_e_dtype():
    f = np.full((3, 3), 120, dtype=np.uint8)
    antes = f.copy()
    g, _ = ajustar_contraste(f, 2.0)
    assert (f == antes).all() and g.dtype == np.uint8 and g is not f


def test_alpha_negativo_invalido():
    with pytest.raises(ValueError):
        ajustar_contraste(np.zeros((2, 2), dtype=np.uint8), alpha=-1)


def test_expansao_de_faixa():
    f = np.array([[100, 150, 200]], dtype=np.uint8)
    g, p = expandir_faixa(f)
    assert g.tolist() == [[0, 128, 255]]  # (50*255/100 = 127,5 -> 128)
    assert (p.minimo, p.maximo) == (100, 200)


def test_expansao_faixa_constante_devolve_copia():
    f = np.full((2, 2), 90, dtype=np.uint8)
    g, _ = expandir_faixa(f)
    assert (g == f).all() and g is not f


def test_percentis_invalidos():
    with pytest.raises(ValueError):
        expandir_faixa(np.zeros((2, 2), dtype=np.uint8), 60, 40)


def test_entrada_nao_cinza():
    with pytest.raises(ValueError):
        ajustar_contraste(np.zeros((2, 2, 3), dtype=np.uint8), 1.0)
