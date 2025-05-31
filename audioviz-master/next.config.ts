
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  basePath: '/audiovizstudio',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Webpack configuration can be removed if not needed for other purposes
  // Keeping COOP/COEP headers commented out as they caused issues in the user's env
  // and are not strictly required for this MediaRecorder approach.
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'Cross-Origin-Opener-Policy',
  //           value: 'same-origin',
  //         },
  //         {
  //           key: 'Cross-Origin-Embedder-Policy',
  //           value: 'require-corp',
  //         },
  //       ],
  //     },
  //   ];
  // },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.output.crossOriginLoading = 'anonymous';
  //     config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
  //   }
  //   config.ignoreWarnings = [
  //     ...(config.ignoreWarnings || []),
  //     /Critical dependency: the request of a dependency is an expression/,
  //     // Example of a more specific regex for FFmpeg sourcemap warnings:
  //     // /Sourcemap for \"[^\"]*ffmpeg-core\.js\" points to missing source file \"[^\"]*ffmpeg-core\.js\.map\"/i,
  //   ];
  //   return config;
  // },
};

export default nextConfig;
