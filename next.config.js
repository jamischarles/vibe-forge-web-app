/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_VERSION: require('./package.json').version,
  },
}

module.exports = nextConfig
