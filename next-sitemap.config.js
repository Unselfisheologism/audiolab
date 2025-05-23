/** @type {import('next-sitemap').IConfig} */
export default {
    siteUrl: 'https://audiolab.in.net', // Replace with your site's URL
    generateRobotsTxt: true, // Enable robots.txt file generation
    additionalPaths: async (config) => [
        { loc: '/audio-forge', changefreq: 'weekly', priority: 0.7 },
        { loc: '/faq', changefreq: 'monthly', priority: 0.5 },
        { loc: '/terms', changefreq: 'monthly', priority: 0.5 },
        { loc: '/privacy', changefreq: 'monthly', priority: 0.5 },
        { loc: '/cookies', changefreq: 'monthly', priority: 0.5 },
        { loc: '/licenses', changefreq: 'monthly', priority: 0.5 },
    ],
    outDir: './out', // Ensure it matches your 'output' directory in next.config.ts
};
