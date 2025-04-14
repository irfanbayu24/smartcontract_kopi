/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side webpack config
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        assert: require.resolve('assert/'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        constants: require.resolve('constants-browserify'),
      };
    }
    return config;
  },
};

module.exports = nextConfig; 