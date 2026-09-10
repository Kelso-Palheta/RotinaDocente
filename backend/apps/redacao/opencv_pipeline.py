"""
Pipeline de Visao Computacional em OpenCV — Gestão Docente
Focado em auto-alinhamento de folha A4 manuscrita, correcao de perspectiva
e remocao de sombras para OCR ultra-rapido (< 500 ms).
"""

import cv2
import numpy as np

def ordenar_pontos_retangulo(pts):
    """Ordena 4 pontos de contorno: [superior-esquerdo, superior-direito, inferior-direito, inferior-esquerdo]."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def corrigir_perspectiva_folha(imagem_np):
    """
    Detecta os 4 cantos da folha de redacao e aplica Transformacao de Perspectiva (Warp Perspective).
    Retorna a imagem perfeitamente ortogonal.
    """
    if imagem_np is None:
        return None

    # Redimensiona para busca rapida de contornos
    altura_orig, largura_orig = imagem_np.shape[:2]
    escala = 800.0 / altura_orig
    pequena = cv2.resize(imagem_np, (int(largura_orig * escala), 800))

    # Converte para tons de cinza e aplica filtro bilateral
    cinza = cv2.cvtColor(pequena, cv2.COLOR_BGR2GRAY)
    suavizada = cv2.GaussianBlur(cinza, (5, 5), 0)
    bordas = cv2.Canny(suavizada, 75, 200)

    # Encontra contornos
    contornos, _ = cv2.findContours(bordas.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contornos = sorted(contornos, key=cv2.contourArea, reverse=True)[:5]

    contorno_folha = None
    for c in contornos:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            contorno_folha = approx
            break

    if contorno_folha is None:
        # Se nao encontrar os 4 cantos perfeitos, retorna a imagem original tratada
        return binarizar_e_remover_sombras(imagem_np)

    # Re-escala os pontos para a resolucao original
    pts_reais = contorno_folha.reshape(4, 2) / escala
    rect = ordenar_pontos_retangulo(pts_reais)
    (tl, tr, br, bl) = rect

    # Calcula largura e altura maxima
    largura_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    largura_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_largura = max(int(largura_a), int(largura_b))

    altura_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    altura_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_altura = max(int(altura_a), int(altura_b))

    dst = np.array([
        [0, 0],
        [max_largura - 1, 0],
        [max_largura - 1, max_altura - 1],
        [0, max_altura - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    folha_alinhada = cv2.warpPerspective(imagem_np, M, (max_largura, max_altura))

    return binarizar_e_remover_sombras(folha_alinhada)

def binarizar_e_remover_sombras(imagem_np):
    """
    Remove sombras e melhora o contraste da caligrafia usando Adaptive Thresholding.
    """
    if len(imagem_np.shape) == 3:
        cinza = cv2.cvtColor(imagem_np, cv2.COLOR_BGR2GRAY)
    else:
        cinza = imagem_np

    # Divisao de fundo para remover iluminacao irregular
    dilatada = cv2.dilate(cinza, np.ones((7, 7), np.uint8))
    fundo_suavizado = cv2.medianBlur(dilatada, 21)
    diff = 255 - cv2.absdiff(cinza, fundo_suavizado)
    normalizada = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)

    # Threshold adaptativo de Otsu
    _, binarizada = cv2.threshold(normalizada, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binarizada
