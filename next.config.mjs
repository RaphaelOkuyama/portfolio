/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  productionBrowserSourceMaps: process.env.PERF_MAPS === '1',
  // AVIF primeiro (~30% menor que WebP nas fotos), WebP para quem não suporta
  images: { formats: ['image/avif', 'image/webp'] },
  // O contato agora é a última seção da jornada na home
  async redirects() {
    return [{ source: '/contact', destination: '/#contato', permanent: false }];
  },
};

export default nextConfig;
