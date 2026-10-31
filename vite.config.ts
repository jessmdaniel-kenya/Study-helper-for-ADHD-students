import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"

function localQuizApi() {
  return {
    name: "local-quiz-api",
    apply: "serve" as const,
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const requestPath = new URL(req.url ?? "/", "http://localhost").pathname
        if (requestPath !== "/api/quiz") {
          next()
          return
        }

        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader("content-type", "application/json; charset=utf-8")
          res.end(JSON.stringify(body))
        }

        if (req.method !== "POST") {
          sendJson(405, { error: "Method not allowed." })
          return
        }

        try {
          let raw = ""
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > 1_000_000) {
              sendJson(413, { error: "Request body is too large." })
              return
            }
            raw += chunk.toString()
          }

          let body: unknown
          try {
            body = JSON.parse(raw || "{}")
          } catch {
            sendJson(400, { error: "Request body must be valid JSON." })
            return
          }

          // @ts-expect-error The Vercel handler is JavaScript and has no type declaration.
          const handler = (await import("./api/quiz.js")).default
          let status = 200
          const apiResponse = {
            status(code: number) {
              status = code
              return this
            },
            json(payload: unknown) {
              sendJson(status, payload)
              return this
            },
            end() {
              res.statusCode = status
              res.end()
              return this
            },
          }

          await handler({ method: req.method, headers: req.headers, body }, apiResponse)
        } catch (error) {
          server.config.logger.error(
            `[local-quiz-api] ${error instanceof Error ? error.message : String(error)}`,
          )
          if (!res.writableEnded) {
            sendJson(500, { error: "The local quiz API failed. Check the dev server terminal for details." })
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  if (mode === "development") {
    const env = loadEnv(mode, process.cwd(), "")
    process.env.SUPABASE_URL ||= env.SUPABASE_URL || env.VITE_SUPABASE_URL
    process.env.SUPABASE_ANON_KEY ||= env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
    process.env.AI_API_KEY ||= env.AI_API_KEY
    process.env.AI_MODEL ||= env.AI_MODEL
  }

  return {
    plugins: [react(), tailwindcss(), localQuizApi()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})