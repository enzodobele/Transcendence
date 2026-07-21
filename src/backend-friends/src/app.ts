import express from "express";
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import friendRoutes from "./routes/friendRoutes";

const app = express();
app.use(express.json());

const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry, prefix: "friends_" });

const httpRequestsTotal = new Counter({
  name: "friends_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: "friends_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const statusCode = String(res.statusCode);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationSeconds);
  });
  next();
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/friends", friendRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`👥 Microservice Friends connecté sur le port ${PORT}`);
});
