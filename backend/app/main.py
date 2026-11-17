import base64
from typing import Annotated, Literal

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.pdi.clahe import aplicar_clahe
from app.pdi.contraste import ajustar_contraste
from app.pdi.equalizacao import equalizar_global
from app.pdi.fourier import filtrar_fourier
from app.pdi.histograma import calcular_histograma
from app.pdi.io import ImagemInvalidaError, codificar_png, ler_imagem, para_cinza
from app.pdi.otsu import limiarizar_otsu

MAX_UPLOAD_BYTES = 20 * 1024 * 1024

app = FastAPI(title="PDI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/process")
async def process(
    file: Annotated[UploadFile, File()],
    method: Annotated[Literal["grayscale", "contrast", "equalize", "clahe", "fourier", "otsu"], Form()] = "clahe",
    alpha: Annotated[float, Form(ge=0.1, le=5)] = 1.5,
    beta: Annotated[float, Form(ge=-255, le=255)] = 0,
    clip_limit: Annotated[float, Form(gt=0, le=40)] = 2.0,
    tile_grid_size: Annotated[int, Form(ge=2, le=32)] = 8,
) -> dict:
    """Processa uma cópia da imagem enviada (PNG/JPEG); o original não é alterado."""
    dados = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(dados) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo maior que 20 MB.")
    try:
        cinza = para_cinza(ler_imagem(dados))
        if method == "grayscale":
            saida = cinza
            params = {}
        elif method == "contrast":
            saida, p = ajustar_contraste(cinza, alpha=alpha, beta=beta)
            params = {"alpha": p.alpha, "beta": p.beta}
        elif method == "equalize":
            saida = equalizar_global(cinza)
            params = {}
        elif method == "clahe":
            saida, p = aplicar_clahe(cinza, clip_limit=clip_limit, tile_grid_size=(tile_grid_size, tile_grid_size))
            params = {"clip_limit": p.clip_limit, "tile_grid_size": f"{tile_grid_size}x{tile_grid_size}"}
        elif method == "fourier":
            saida, p = filtrar_fourier(cinza)
            params = {"colunas_removidas": ", ".join(str(f) for f in p.frequencias_removidas) or "nenhuma"}
        else:
            saida, limiar = limiarizar_otsu(cinza)
            params = {"limiar": int(limiar)}

        resposta = {
            "method": method,
            "params": params,
            "width": int(saida.shape[1]),
            "height": int(saida.shape[0]),
            "processed_png_base64": base64.b64encode(codificar_png(saida)).decode("ascii"),
        }
        if method in ("grayscale", "otsu"):
            histograma = calcular_histograma(saida)
            intensidades = np.arange(256)
            media = float(np.dot(histograma, intensidades) / saida.size)
            desvio = float(np.sqrt(np.dot(histograma, (intensidades - media) ** 2) / saida.size))
            resposta.update({
                "histogram": histograma.tolist(),
                "mean": media,
                "standard_deviation": desvio,
            })
    except ImagemInvalidaError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Erro ao processar a imagem.") from exc

    return resposta
