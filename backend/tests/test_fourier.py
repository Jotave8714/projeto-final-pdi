import numpy as np
import pytest

from app.pdi.fourier import filtrar_fourier


def _imagem_com_listras(h=256, w=320, periodo=5, amplitude=3):
    rng = np.random.default_rng(0)
    base = np.full((h, w), 200.0)
    base[100:110, 40:280] -= 120  # "texto"
    # amplitude varia por linha, como nas amostras reais (energia espalhada em todo fy)
    por_linha = rng.uniform(0.5, 1.5, (h, 1))
    listras = amplitude * por_linha * np.sin(2 * np.pi * np.arange(w) / periodo)[None, :]
    ruido = rng.normal(0, 0.2, (h, w))
    return np.clip(base + listras + ruido, 0, 255).astype(np.uint8)


def test_remove_listras_verticais_periodicas():
    img = _imagem_com_listras()
    saida, p = filtrar_fourier(img)
    assert saida.dtype == np.uint8 and saida.shape == img.shape
    fundo_antes = img[150:250, 20:300].astype(float).std(axis=0).mean() + img[150:250].mean(axis=0).std()
    fundo_depois = saida[150:250, 20:300].astype(float).std(axis=0).mean() + saida[150:250].mean(axis=0).std()
    assert fundo_depois < fundo_antes / 3
    assert len(p.frequencias_removidas) >= 2
    # o "texto" escuro continua escuro
    assert saida[102:108, 100:200].mean() < 110


def test_sem_periodicidade_devolve_copia_igual():
    rng = np.random.default_rng(1)
    img = rng.integers(100, 140, (128, 128), dtype=np.uint8)
    saida, p = filtrar_fourier(img, z_min=50)
    assert p.frequencias_removidas == ()
    assert np.array_equal(saida, img) and saida is not img


def test_nao_altera_a_entrada():
    img = _imagem_com_listras()
    copia = img.copy()
    filtrar_fourier(img)
    assert np.array_equal(img, copia)


def test_valida_entrada():
    with pytest.raises(ValueError):
        filtrar_fourier(np.zeros((4, 4, 3), dtype=np.uint8))
    with pytest.raises(ValueError):
        filtrar_fourier(np.zeros((8, 8), dtype=np.uint8), z_min=0)
