/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 standalone 输出，便于 Docker 运行时复用更小的镜像层。
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
