/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    devServer: {
        allowedDevOrigins: [
            "https://6000-firebase-studio-1761068924081.cluster-m7dwy2bmizezqukxkuxd55k5ka.cloudworkstations.dev",
        ],
    },
};

export default nextConfig;
