/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  productionBrowserSourceMaps: process.env.PERF_MAPS === '1',
  // AVIF primeiro (~30% menor que WebP nas fotos), WebP para quem não suporta
  images: { formats: ['image/avif', 'image/webp'] },
  // CSS embutido no HTML: sem a requisição de CSS bloqueando a primeira pintura, a página pinta
  // assim que o HTML chega, antes do JavaScript hidratar (antes a hidratação rodava enquanto o
  // CSS ainda carregava, e a primeira pintura ficava esperando o JS)
  experimental: { inlineCss: true },
  // O contato agora é a última seção da jornada na home
  async redirects() {
    return [{ source: '/contact', destination: '/#contato', permanent: false }];
  },
};

export default nextConfig;
