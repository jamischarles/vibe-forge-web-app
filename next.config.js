// Node 22+ ships a localStorage global that requires --localstorage-file to work.
// Next.js SSR hits it and crashes. Delete the broken global before anything else loads.
if (typeof globalThis.localStorage !== 'undefined' && typeof window === 'undefined') {
  try {
    globalThis.localStorage.getItem('__test')
  } catch {
    delete globalThis.localStorage
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_VERSION: require('./package.json').version,
  },
}

module.exports = nextConfig
