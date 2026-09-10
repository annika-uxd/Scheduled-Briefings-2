/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The floating dev badge overlaps the module chrome in screenshots and
  // demos; the prototype is reviewed visually, so keep the viewport clean.
  devIndicators: false,
};

export default nextConfig;
