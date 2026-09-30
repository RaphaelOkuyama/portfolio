/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // O contato agora é a última seção da jornada na home
  async redirects() {
    return [{ source: '/contact', destination: '/#contato', permanent: false }];
  },
};

export default nextConfig;
