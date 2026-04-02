import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, 
    proxy: {
      // Whenever the app asks for /web/Ajax_ctrl, automatically send it to enam.gov.in
      '/web/Ajax_ctrl': {
        target: 'https://enam.gov.in',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})