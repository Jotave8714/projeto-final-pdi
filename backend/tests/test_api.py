import base64
import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.pdi.histograma import calcular_histograma
from app.pdi.io import codificar_png, ler_imagem, para_cinza

client = TestClient(app)


def _png(w=64, h=48) -> bytes:
    rng = np.random.default_rng(0)
    arr = rng.integers(100, 160, size=(h, w), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


def _post(method="clahe", data=None, content=None, name="a.png", ctype="image/png"):
    form = {"method": method, **(data or {})}
    return client.post("/api/process", files={"file": (name, content if content is not None else _png(), ctype)}, data=form)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


@pytest.mark.parametrize("method", ["contrast", "equalize", "clahe", "otsu"])
def test_metodos_validos_retornam_png(method):
    r = _post(method)
    assert r.status_code == 200
    body = r.json()
    assert body["method"] == method
    assert (body["width"], body["height"]) == (64, 48)
    img = Image.open(io.BytesIO(base64.b64decode(body["processed_png_base64"])))
    assert img.size == (64, 48)


def test_parametros_retornados():
    r = _post("clahe", {"clip_limit": "3", "tile_grid_size": "4"})
    assert r.json()["params"] == {"clip_limit": 3.0, "tile_grid_size": "4x4"}
    r = _post("contrast", {"alpha": "2", "beta": "10"})
    assert r.json()["params"] == {"alpha": 2.0, "beta": 10.0}


def test_arquivo_invalido():
    r = _post(content=b"isto nao e imagem", name="x.png")
    assert r.status_code == 422
    assert "detail" in r.json()


def test_formato_nao_suportado():
    buf = io.BytesIO()
    Image.new("L", (8, 8)).save(buf, format="BMP")
    assert _post(content=buf.getvalue(), name="x.bmp", ctype="image/bmp").status_code == 422


@pytest.mark.parametrize("data", [{"alpha": "99"}, {"clip_limit": "0"}, {"tile_grid_size": "1"}, {"beta": "9999"}])
def test_parametros_fora_do_intervalo(data):
    assert _post("clahe", data).status_code == 422


def test_metodo_desconhecido():
    assert _post("magia").status_code == 422


def test_sem_arquivo():
    assert client.post("/api/process", data={"method": "clahe"}).status_code == 422


def test_process_fourier_devolve_png():
    import io

    import numpy as np
    from fastapi.testclient import TestClient
    from PIL import Image

    from app.main import app

    buf = io.BytesIO()
    Image.fromarray(np.full((64, 64), 128, dtype=np.uint8)).save(buf, format="PNG")
    r = TestClient(app).post(
        "/api/process", files={"file": ("a.png", buf.getvalue(), "image/png")}, data={"method": "fourier"}
    )
    assert r.status_code == 200
    assert r.json()["method"] == "fourier"


@pytest.mark.parametrize("image", [
    np.zeros((8, 12), dtype=np.uint8),
    np.full((8, 12), 255, dtype=np.uint8),
    np.arange(256, dtype=np.uint8).reshape(16, 16),
    np.array([[[255, 0, 0], [0, 255, 0], [0, 0, 255]]], dtype=np.uint8),
])
def test_histograma_corresponde_a_imagem_cinza_retornada(image):
    original = image.copy()
    response = _post("grayscale", content=codificar_png(image))
    assert response.status_code == 200
    body = response.json()
    cinza = ler_imagem(base64.b64decode(body["processed_png_base64"]))
    np.testing.assert_array_equal(cinza, para_cinza(image))
    np.testing.assert_array_equal(image, original)
    histogram = body["histogram"]
    assert len(histogram) == 256
    assert sum(histogram) == body["width"] * body["height"] == cinza.size
    np.testing.assert_array_equal(histogram, calcular_histograma(cinza))
    assert body["mean"] == pytest.approx(float(cinza.mean()))
    assert body["standard_deviation"] == pytest.approx(float(cinza.std()))


def test_histograma_de_novo_documento_independe_do_anterior():
    preto = _post("grayscale", content=codificar_png(np.zeros((4, 5), dtype=np.uint8))).json()
    branco = _post("grayscale", content=codificar_png(np.full((7, 8), 255, dtype=np.uint8))).json()
    assert preto["histogram"][0] == 20
    assert preto["histogram"][255] == 0
    assert branco["histogram"][0] == 0
    assert branco["histogram"][255] == 56


def test_histograma_preserva_resultados_do_pipeline_sequencial():
    original = _png()
    consulta = _post("grayscale", content=original)
    assert consulta.status_code == 200
    direto = original
    apos_consulta = base64.b64decode(consulta.json()["processed_png_base64"])
    for method in ["clahe", "equalize", "contrast", "fourier", "otsu"]:
        dados = {"alpha": "2", "beta": "10", "clip_limit": "3", "tile_grid_size": "4"}
        resposta_direta = _post(method, data=dados, content=direto)
        resposta_cinza = _post(method, data=dados, content=apos_consulta)
        assert resposta_direta.status_code == resposta_cinza.status_code == 200
        assert resposta_direta.json() == resposta_cinza.json()
        direto = base64.b64decode(resposta_direta.json()["processed_png_base64"])
        apos_consulta = base64.b64decode(resposta_cinza.json()["processed_png_base64"])


def test_histograma_rejeita_imagem_invalida():
    assert _post("grayscale", content=b"arquivo invalido").status_code == 422


@pytest.mark.parametrize("image", [
    np.zeros((8, 12), dtype=np.uint8),
    np.full((8, 12), 255, dtype=np.uint8),
    np.arange(256, dtype=np.uint8).reshape(16, 16),
])
def test_histograma_final_corresponde_a_saida_real_de_otsu(image):
    response = _post("otsu", content=codificar_png(image))
    assert response.status_code == 200
    body = response.json()
    saida = ler_imagem(base64.b64decode(body["processed_png_base64"]))
    assert len(body["histogram"]) == 256
    assert sum(body["histogram"]) == image.size
    assert sum(body["histogram"][1:255]) == 0
    np.testing.assert_array_equal(body["histogram"], calcular_histograma(saida))
    assert body["mean"] == pytest.approx(float(saida.mean()))
    assert body["standard_deviation"] == pytest.approx(float(saida.std()))


def test_histogramas_inicial_e_final_sao_das_respectivas_imagens():
    atual = _png()
    inicial = _post("grayscale", content=atual).json()
    atual = base64.b64decode(inicial["processed_png_base64"])
    for method in ["clahe", "equalize", "contrast", "fourier", "otsu"]:
        response = _post(method, content=atual)
        assert response.status_code == 200
        final = response.json()
        atual = base64.b64decode(final["processed_png_base64"])
    assert inicial["histogram"] != final["histogram"]
    assert sum(inicial["histogram"]) == sum(final["histogram"]) == 64 * 48
    assert sum(inicial["histogram"][1:255]) == 64 * 48
    assert sum(final["histogram"][1:255]) == 0
    np.testing.assert_array_equal(final["histogram"], calcular_histograma(ler_imagem(atual)))
