/** @type {import('next').NextConfig} */
const staticProjects = ["sorry", "nicetomeetyou", "give-me-love", "rgb-popups", "scc-motion"];

const nextConfig = {
  async rewrites() {
    return staticProjects.map((project) => ({
      source: `/${project}`,
      destination: `/${project}/index.html`,
    }));
  },
};

export default nextConfig;
