import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const base = process.env.VITE_BASE ?? '/'

/** 개발 서버에서 /make 를 /make/ 로 보낸다 (배포 Pages 는 폴더 주소를 알아서 처리) */
function makeTrailingSlash(): Plugin {
  return {
    name: 'make-trailing-slash',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query] = (req.url ?? '').split('?')
        if (path === `${base}make`) {
          res.statusCode = 301
          res.setHeader('Location', `${base}make/${query ? `?${query}` : ''}`)
          res.end()
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), makeTrailingSlash()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        make: fileURLToPath(new URL('./make/index.html', import.meta.url)),
      },
    },
  },
})
