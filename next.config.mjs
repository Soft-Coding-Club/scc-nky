/** @type {import('next').NextConfig} */
const staticProjects = ["sorry", "nicetomeetyou", "give-me-love", "rgb-popups", "scc-motion"];

const nextConfig = {
  async rewrites() {
    return [
      ...staticProjects.map((project) => ({
        source: `/${project}`,
        destination: `/${project}/index.html`,
      })),
      ...["r", "g", "b"].map((channel) => ({
        source: `/rgb-popups/${channel}`,
        destination: "/rgb-popups/popup.html",
      })),
    ];
  },
};

export default nextConfig;
