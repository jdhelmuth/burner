/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@burner/core", "@burner/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" }
    ]
  }
};

export default nextConfig;
