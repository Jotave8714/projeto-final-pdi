import numpy as np
import pytest

from app.pdi.clahe import aplicar_clahe


def _texto_fraco():
    f = np.full((64, 64), 200, dtype=np.uint8)
    f[20:44, 30:34] = 190  # traço de baixo contraste
    return f


def test_parametros_registrados():
    _, p = aplicar_clahe(_texto_fraco(), clip_limit=3.0, tile_grid_size=(4, 4))
    assert p.clip_limit == 3.0 and p.tile_grid_size == (4, 4)
    assert p.como_dict() == {"clip_limit": 3.0, "tile_grid_size": (4, 4)}


def test_formato_dtype_e_entrada_intacta():
    f = _texto_fraco()
    antes = f.copy()
    g, _ = aplicar_clahe(f)
    assert g.shape == f.shape and g.dtype == np.uint8
    assert (f == antes).all()


def test_aumenta_contraste_do_traco_fraco():
    f = _texto_fraco()
    g, _ = aplicar_clahe(f, clip_limit=4.0, tile_grid_size=(2, 2))
    antes = abs(int(f[30, 31]) - int(f[30, 10]))
    depois = abs(int(g[30, 31]) - int(g[30, 10]))
    assert depois > antes


def test_deterministico():
    f = _texto_fraco()
    assert (aplicar_clahe(f)[0] == aplicar_clahe(f)[0]).all()


@pytest.mark.parametrize("clip,tiles", [(0, (8, 8)), (-1, (8, 8)), (2, (0, 8)), (2, (8,))])
def test_parametros_invalidos(clip, tiles):
    with pytest.raises(ValueError):
        aplicar_clahe(_texto_fraco(), clip, tiles)


def test_entrada_nao_cinza():
    with pytest.raises(ValueError):
        aplicar_clahe(np.zeros((8, 8, 3), dtype=np.uint8))
