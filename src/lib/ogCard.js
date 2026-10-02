import { ImageResponse } from 'next/og';
import { ridgePoints } from './journey/ridge';
import { THEMES, SEASONS } from './palette';
import { loadMincho } from './ogFont';

// Cartão de compartilhamento (1200x630) comum à home e às páginas de projeto:
// kanji gigante ao fundo, título em mincho, assinatura com o carimbo 奥山 e as montanhas
export const OG_SIZE = { width: 1200, height: 630 };

const night = THEMES.night;
// Outono: a mesma estação em que a montanha fica parada fora da home
const autumn = SEASONS.night[2];

function ridge(seed, base, amp) {
  const { width, height } = OG_SIZE;
  const points = ridgePoints({ seed, width, segments: 60, baseHeight: base, amplitude: -amp });
  const line = points.map(([x, y]) => `L${(x + width / 2).toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `M0,${height} ${line} L${width},${height} Z`;
}

export async function ogCard({ eyebrow, title, subtitle, kanji, signature = 'Raphael Okuyama' }) {
  const text = `${kanji}作奥山${title}${subtitle}${eyebrow}${signature}`;

  // Sem a fonte (rede fora no build) o card sai só com texto latino, sem quadrados vazios
  let fonts = [];
  try {
    const [bold, regular] = await Promise.all([loadMincho(text, 800), loadMincho(text, 600)]);
    fonts = [
      { name: 'Mincho', data: bold, weight: 800, style: 'normal' },
      { name: 'Mincho', data: regular, weight: 600, style: 'normal' },
    ];
  } catch {
    fonts = [];
  }
  const jp = fonts.length > 0;
  const kanjiSize = Array.from(kanji).length > 1 ? 420 : 560;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', position: 'relative',
          background: `linear-gradient(180deg, ${autumn.sky} 0%, ${night.bgColor} 78%)`,
          color: night.textPrimary, fontFamily: jp ? 'Mincho' : undefined,
        }}
      >
        <svg width={OG_SIZE.width} height={OG_SIZE.height} viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`} style={{ position: 'absolute', inset: 0 }}>
          <path d={ridge(19, 470, 210)} fill={autumn.mountains[2]} opacity="0.55" />
          <path d={ridge(31, 540, 170)} fill={autumn.mountains[1]} opacity="0.8" />
          <path d={ridge(7, 610, 120)} fill={autumn.mountains[0]} />
        </svg>

        {jp && (
          <div
            style={{
              position: 'absolute', right: 40, top: -30, display: 'flex',
              fontSize: kanjiSize, fontWeight: 800, lineHeight: 1, color: night.accent, opacity: 0.22,
            }}
          >
            {kanji}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', padding: '64px 72px', width: '100%', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 26, letterSpacing: 6, color: night.accent, fontWeight: 600 }}>
            {jp && <span style={{ color: night.hanko, fontWeight: 800 }}>作</span>}
            {eyebrow}
          </div>
          <div style={{ display: 'flex', fontSize: title.length > 28 ? 68 : 84, fontWeight: 800, lineHeight: 1.1, marginTop: 36, maxWidth: 900 }}>
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 600, lineHeight: 1.4, marginTop: 24, maxWidth: 820, color: night.textSecondary }}>
            {subtitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 'auto' }}>
            {jp && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64,
                  border: `4px solid ${night.hanko}`, borderRadius: 8, color: night.hanko,
                  fontSize: 24, fontWeight: 800, lineHeight: 1, textAlign: 'center',
                }}
              >
                奥山
              </div>
            )}
            <span style={{ fontSize: 30, fontWeight: 600 }}>{signature}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
