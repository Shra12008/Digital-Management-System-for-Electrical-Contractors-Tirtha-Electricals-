import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Forwards every /api/* call made by the React app straight to the
      // Spring Boot backend on the server side (not the browser), so no
      // CORS headers are needed on the backend at all. This means we
      // never have to touch ProjectController / LabourController /
      // DailyWorkController.
      // NOTE: target updated to 8081 since port 8081 was occupied by
      // another local service (Oracle TNS listener) — this matches the
      // server.port=8081 you added to application.properties. If you ever
      // move the backend back to 8081, just change this one value.
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        // Needed for the Phase 3 notification WebSocket (/api/ws) to be
        // proxied the same way as every ordinary HTTP call above - without
        // this, the STOMP client's connection to /api/ws would fail since
        // Vite's dev proxy doesn't upgrade WebSocket connections by default.
        ws: true,
      },
    },
  },
})
