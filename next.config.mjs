const nextConfig = {
  transpilePackages: ['@paroki/ui'],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
  },
  experimental: {
    outputFileTracingIncludes: {
      // getBibleText() (src/lib/liturgi/bible-rag.ts) membaca file ini lewat
      // fs di runtime -- tanpa baris ini, Vercel tidak menyertakan file JSON
      // ini ke deployment bundle (path dibangun via path.join(), bukan
      // string literal yang bisa dianalisis statis oleh output file tracing
      // Next.js).
      '/api/renungan/generate': ['./data/bible nabre/bible-id.json'],
    },
  },
};
export default nextConfig;
