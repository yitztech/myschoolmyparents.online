import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Corta el build de producción si VITE_AUTH_API_URL viene vacío.
 *
 * Con ese valor vacío, src/lib/auth.ts entra en modo mock: registro, login
 * y recuperación se resolverían contra localStorage, con las contraseñas
 * "hasheadas" por una función reversible y el código de recuperación
 * devuelto al propio cliente. Es un fallo silencioso —la app arranca y
 * parece funcionar— así que lo detenemos donde se nota: en la imagen, no
 * en el navegador de alguien.
 */
function requireAuthApiUrl(authApiUrl: string): Plugin {
  return {
    name: 'msm-require-auth-api-url',
    apply: 'build',
    buildStart() {
      if (authApiUrl.trim() !== '') return
      throw new Error(
        'VITE_AUTH_API_URL está vacío en un build de producción.\n' +
          'Eso activaría el mock de localStorage y la autenticación nunca llegaría al backend.\n' +
          'Pon VITE_AUTH_API_URL=/api en .env.prod y reconstruye con --build.',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv recoge tanto los ficheros .env como las VITE_* de process.env
  // (que es como las inyecta nginx/Dockerfile.prod).
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), tailwindcss(), requireAuthApiUrl(env.VITE_AUTH_API_URL ?? '')],
    server: {
      host: true,
      port: 5173,
      // OrbStack expone cada contenedor como <servicio>.<proyecto>.orb.local.
      // Sin esto, `npm run dev` tras el proxy rechaza el Host con 403.
      allowedHosts: ['localhost', '.orb.local'],
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://backend:3001',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 4173,
      // El dominio del nginx en OrbStack (ver OrbStack > nginx > Domain):
      //   nginx.my-school-my-parents.orb.local
      // llega al `vite preview` con Host = ese dominio a través del proxy
      // nginx -> frontend:4173. Hay que permitirlo o responde 403
      // "Blocked request. This host is not allowed".
      allowedHosts: ['localhost', '.orb.local'],
    },
  }
})
