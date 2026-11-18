/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/dashboard/address-book", destination: "/address-book", permanent: false },
      { source: "/dashboard/map", destination: "/map", permanent: false },
      { source: "/dashboard/treeview", destination: "/tree", permanent: false },
      { source: "/contact", destination: "/dashboard", permanent: false }
    ];
  }
};

export default nextConfig;
