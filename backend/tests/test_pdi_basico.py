import numpy as np
import pytest

from app.pdi.histograma import calcular_histograma, figura_comparacao
from app.pdi.io import ImagemInvalidaError, codificar_png, ler_imagem, para_cinza


def test_ler_png_rgb_e_nao_altera_bytes():
    rgb = np.zeros((4, 5, 3), dtype=np.uint8)
    rgb[..., 0] = 255
    dados = codificar_png(rgb)
    copia = bytes(dados)
    lida = ler_imagem(dados)
    assert lida.shape == (4, 5, 3) and lida.dtype == np.uint8
    assert dados == copia
    assert (lida == rgb).all()


def test_ler_png_cinza():
    img = np.arange(16, dtype=np.uint8).reshape(4, 4)
    assert (ler_imagem(codificar_png(img)) == img).all()


@pytest.mark.parametrize("dados", [b"", b"nao e imagem", b"GIF89a" + b"\x00" * 20])
def test_entrada_invalida(dados):
    with pytest.raises(ImagemInvalidaError):
        ler_imagem(dados)


def test_arquivo_inexistente(tmp_path):
    with pytest.raises(ImagemInvalidaError):
        ler_imagem(tmp_path / "nao_existe.png")


def test_formato_nao_suportado():
    import io
    from PIL import Image

    buf = io.BytesIO()
    Image.fromarray(np.zeros((4, 4), dtype=np.uint8)).save(buf, format="BMP")
    with pytest.raises(ImagemInvalidaError):
        ler_imagem(buf.getvalue())


def test_para_cinza_valores_conhecidos():
    rgb = np.array([[[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 255]]], dtype=np.uint8)
    cinza = para_cinza(rgb)
    assert cinza.dtype == np.uint8 and cinza.shape == (1, 4)
    # ITU-R 601: 0,299 / 0,587 / 0,114 (tolerância de 1 por arredondamento)
    esperado = np.array([[76, 150, 29, 255]])
    assert np.abs(cinza.astype(int) - esperado).max() <= 1


def test_para_cinza_nao_altera_entrada():
    rgb = np.full((3, 3, 3), 100, dtype=np.uint8)
    antes = rgb.copy()
    para_cinza(rgb)
    assert (rgb == antes).all()


def test_histograma_valores_conhecidos():
    img = np.array([[0, 0, 255], [255, 255, 10]], dtype=np.uint8)
    h = calcular_histograma(img)
    assert h.shape == (256,)
    assert h[0] == 2 and h[255] == 3 and h[10] == 1
    assert h.sum() == img.size


def test_figura_rotulada():
    img = np.tile(np.arange(0, 256, 16, dtype=np.uint8), (16, 1))
    fig = figura_comparacao({"Original": img, "Outra": img}, titulo="t")
    assert len(fig.axes) == 4
    assert fig.axes[2].get_xlabel() == "Intensidade (0-255)"
