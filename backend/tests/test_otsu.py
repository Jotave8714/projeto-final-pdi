import numpy as np
import pytest

from app.pdi.otsu import limiarizar_otsu


def test_bimodal_separa_classes():
    f = np.full((10, 10), 200, dtype=np.uint8)
    f[:, :5] = 50
    b, t = limiarizar_otsu(f)
    assert 50 <= t < 200
    assert set(np.unique(b)) == {0, 255}
    assert (b[:, :5] == 0).all() and (b[:, 5:] == 255).all()


def test_entrada_intacta_e_dtype():
    f = np.random.default_rng(0).integers(0, 255, (8, 8), dtype=np.uint8)
    antes = f.copy()
    b, _ = limiarizar_otsu(f)
    assert (f == antes).all() and b.dtype == np.uint8


def test_entrada_invalida():
    with pytest.raises(ValueError):
        limiarizar_otsu(np.zeros((4, 4, 3), dtype=np.uint8))
