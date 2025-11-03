/** @type {import('next').NextConfig} */
const nextConfig = {

    images:{
        remotePatterns:[
            {
                protocol:'https',
                hostname:'fastly.picsum.photos',
                pathname:'/**',
            },
        ],
    },

};

export default nextConfig;


