import base64
import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

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
