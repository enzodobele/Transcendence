import express from "express";
import friendRoutes from "./routes/friendRoutes";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/friends", friendRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`👥 Microservice Friends connecté sur le port ${PORT}`);
});
