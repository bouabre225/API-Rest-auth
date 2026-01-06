import express from "express";
import cors from "cors";
import helmet from "helmet";

import { httpLogger } from "#lib/logger";
import { errorHandler } from "#middlewares/error-handler";
import { notFoundHandler } from "#middlewares/not-found";
import userRoutes from "#routes/user.routes";
import adminRoutes from "#routes/admin.routes";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(httpLogger);
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "API Express opérationnelle" });
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app; // CRITIQUE : On exporte l'objet sans le démarrer