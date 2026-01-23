/** @type {import('knip').KnipConfig} */
export default {
  // 1. Entry Points
  // Ensure these paths are 100% correct relative to where you run 'bun knip'
  entry: [
    'server/server.tsx', 
    'web/client.tsx' ,
    '*.{ts,tsx,js,jsx,css}',
  ],

  // 2. Project Files
  project: [
    'server/**/*.{ts,tsx,js,jsx}',
    'web/**/*.{ts,tsx,js,jsx,css}'
  ],

  ignore: [
    '**/*.d.ts'
  ],

  ignoreBinaries: [
    'infisical',
    'tsc',
  ],

  // 3. CRITICAL FIX: TypeScript Configuration
  // If "web" and "server" have their own tsconfig files, Knip needs to know!
  // If you only have one root tsconfig, you can remove the specific paths.
//   tsconfig: 'tsconfig.json', // Fallback
  
  // If you have separate configs, you might need to run knip differently 
  // or merge them, but often explicit plugins help:
  tailwind: {
    config: 'web/tailwind.config.js'
  },
  vite: {
    config: 'web/vite.config.ts'
  },
  postcss: {
    config: 'web/postcss.config.js'
  },
};