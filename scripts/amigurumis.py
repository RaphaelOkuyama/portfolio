# Fotos dos amigurumis (originais PNG de 2048 px do repositório catalago-amigurumis) num padrão só:
# fundo corrigido para branco puro (os originais têm branco, cinza azulado e degradê; a estrelinha
# da marca d'água, mais clara que o fundo, some junto), peça centralizada e na mesma escala.
#
#   python scripts/amigurumis.py <pasta com os PNG originais> public/projects/saeko-artes
#
# Precisa de numpy, scipy e Pillow. Saída: <nome>.jpg de 1000 × 1000 (a galeria e o rolo mostram
# a foto inteira sobre branco, então o fundo tem que ser branco de verdade em todas)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1]
DST = sys.argv[2]
NAMES = ['capivara', 'leao', 'panda', 'girassol', 'elefante', 'frajola', 'pintinho', 'uvinha']
SIZE = 1000
FILL = 0.80  # lado maior da peça / lado do quadro


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def background_field(img):
    """Ajusta uma superfície quadrática ao fundo, amostrado na faixa da borda."""
    H, W, _ = img.shape
    band = max(8, int(min(H, W) * 0.05))
    yy, xx = np.mgrid[0:H, 0:W]
    edge = (yy < band) | (yy >= H - band) | (xx < band) | (xx >= W - band)
    mx, mn = img.max(2), img.min(2)
    cand = edge & ((mx - mn) < 0.06) & (mn > 0.8)
    ys, xs = np.nonzero(cand)
    step = max(1, len(ys) // 80000)
    ys, xs = ys[::step], xs[::step]
    X = xs / (W - 1) * 2 - 1
    Y = ys / (H - 1) * 2 - 1
    A = np.stack([np.ones_like(X), X, Y, X * X, X * Y, Y * Y], 1)
    gx = np.linspace(-1, 1, W, dtype=np.float32)[None, :]
    gy = np.linspace(-1, 1, H, dtype=np.float32)[:, None]
    field = np.empty_like(img)
    for c in range(3):
        v = img[ys, xs, c]
        coef, *_ = np.linalg.lstsq(A, v, rcond=None)
        r = v - A @ coef
        keep = np.abs(r) < 3 * r.std() + 1e-3
        coef, *_ = np.linalg.lstsq(A[keep], v[keep], rcond=None)
        k = coef.astype(np.float32)
        field[..., c] = k[0] + k[1] * gx + k[2] * gy + k[3] * gx * gx + k[4] * gx * gy + k[5] * gy * gy
    return np.clip(field, 0.6, 1.0), int(cand.sum())


def product_mask(norm):
    """A peça: o que não é fundo (escuro ou colorido), sem ruído nem pedaços minúsculos."""
    H, W, _ = norm.shape
    mn, mx = norm.min(2), norm.max(2)
    mask = (mn < 0.86) | ((mx - mn) > 0.10)
    mask = ndimage.binary_opening(mask, iterations=2)
    labels, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    return np.isin(labels, 1 + np.nonzero(sizes >= 0.0006 * H * W)[0])


def local_field(img, quad, keep):
    """Longe da peça, o fundo medido no lugar (manchas e vinheta que a quadrática não pega);
    perto dela fica a quadrática, para a sombra de contato continuar existindo."""
    H, W, _ = img.shape
    near = ndimage.binary_dilation(keep, iterations=max(20, int(min(H, W) * 0.05)))
    w = (~near).astype(np.float32)
    sigma = min(H, W) * 0.02
    den = ndimage.gaussian_filter(w, sigma)
    field = np.empty_like(img)
    for c in range(3):
        num = ndimage.gaussian_filter(img[..., c] * w, sigma)
        loc = num / np.maximum(den, 1e-4)
        k = smoothstep(0.2, 0.7, den)
        field[..., c] = loc * k + quad[..., c] * (1 - k)
    return np.clip(field, 0.6, 1.0)


def feather_edges(norm, box):
    """A borda da foto original some no branco do quadro (só nos lados em que a peça está longe)."""
    H, W, _ = norm.shape
    x0, y0, x1, y1 = box
    ramp = min(H, W) * 0.04
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    k = np.ones((H, W), np.float32)
    if x0 > 2 * ramp: k *= smoothstep(0, ramp, xx)
    if W - x1 > 2 * ramp: k *= smoothstep(0, ramp, W - 1 - xx)
    if y0 > 2 * ramp: k *= smoothstep(0, ramp, yy)
    if H - y1 > 2 * ramp: k *= smoothstep(0, ramp, H - 1 - yy)
    k = k[..., None]
    return norm * k + (1 - k)


def whiten(norm):
    # Ruído do fundo (JPEG, granulado) vira branco; o branco da lã continua com a textura
    t = smoothstep(0.955, 0.985, norm.min(2))[..., None]
    return norm * (1 - t) + t


for name in NAMES:
    img = np.asarray(Image.open(f'{SRC}/{name}.png').convert('RGB'), dtype=np.float32) / 255
    quad, samples = background_field(img)
    keep = product_mask(whiten(np.clip(img / quad, 0, 1)))
    field = local_field(img, quad, keep)
    norm = whiten(np.clip(img / field, 0, 1))
    ys, xs = np.nonzero(product_mask(norm))
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    norm = feather_edges(norm, (x0, y0, x1, y1))
    bw, bh = x1 - x0, y1 - y0
    scale = FILL * SIZE / max(bw, bh)
    # Quadro no espaço da foto original: centrado na peça, completado com branco onde passar da borda
    side = SIZE / scale
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left, top = cx - side / 2, cy - side / 2
    pil = Image.fromarray((norm * 255 + 0.5).astype(np.uint8))
    out = pil.transform((SIZE, SIZE), Image.AFFINE, (1 / scale, 0, left, 0, 1 / scale, top),
                        resample=Image.BICUBIC, fillcolor=(255, 255, 255))
    out.save(f'{DST}/{name}.jpg', quality=88, optimize=True, progressive=True, subsampling=0)
    corner = np.asarray(out)[[4, 4, -5, -5], [4, -5, 4, -5]].tolist()
    print(f'{name}: box {bw}x{bh} scale {scale:.3f} samples {samples} corners {corner}')
