import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { logger } from "#lib/logger";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`);
});