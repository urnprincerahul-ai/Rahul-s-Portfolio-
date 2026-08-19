import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to ensure root /assets/audio/ directory is served in dev and copied to dist/ in build
function audioAssetSync(): Plugin {
  return {
    name: 'audio-asset-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.startsWith('/assets/audio/') || req.url.startsWith('assets/audio/'))) {
          const cleanPath = req.url.replace(/^\/?assets\/audio\//, '');
          const localPath = path.resolve(__dirname, 'assets/audio', cleanPath);
          const publicLocalPath = path.resolve(__dirname, 'public/assets/audio', cleanPath);
          
          const fileToServe = fs.existsSync(localPath) ? localPath : (fs.existsSync(publicLocalPath) ? publicLocalPath : null);
          if (fileToServe && fs.statSync(fileToServe).isFile()) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Accept-Ranges', 'bytes');
            fs.createReadStream(fileToServe).pipe(res);
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      const srcAudioDir = path.resolve(__dirname, 'assets/audio');
      const distAudioDir = path.resolve(__dirname, 'dist/assets/audio');
      if (fs.existsSync(srcAudioDir)) {
        if (!fs.existsSync(distAudioDir)) {
          fs.mkdirSync(distAudioDir, { recursive: true });
        }
        const files = fs.readdirSync(srcAudioDir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            fs.copyFileSync(path.join(srcAudioDir, file), path.join(distAudioDir, file));
          }
        }
      }
    }
  };
}

export default defineConfig(() => {
  return {
    // Relative base path ensures GitHub Pages (root or subpath repositories) resolve all assets seamlessly
    base: process.env.VITE_BASE || './',
    plugins: [react(), tailwindcss(), audioAssetSync()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});


