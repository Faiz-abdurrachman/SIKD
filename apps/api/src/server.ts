import cors from "cors";
import express from "express";
import morgan from "morgan";

import { sendError } from "./lib/api-response";
import { devAuthMiddleware } from "./middlewares/dev-auth";
import { v1Router } from "./routes/v1";

const app = express();

const apiPort = Number(process.env.API_PORT ?? 3001);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "API up",
    timestamp: new Date().toISOString(),
  });
});

app.use(devAuthMiddleware);
app.use("/api/v1", v1Router);

app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  void next;
  console.error("[api.unhandled]", error);
  return sendError(response, "INTERNAL_ERROR", "Terjadi kesalahan server", 500);
});

app.listen(apiPort, () => {
  console.log(`[api] running on http://localhost:${apiPort}`);
  console.log(`[api] allowed web origin: ${webOrigin}`);
});
