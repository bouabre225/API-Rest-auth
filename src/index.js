import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { logger } from "#lib/logger";
import { startJobs } from "./jobs/cleanup.job.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`);
  
  // Start cron jobs only in production
  if (process.env.NODE_ENV === 'production') {
    startJobs();
    logger.info('Cron jobs started');
  } else {
    logger.info('Cron jobs disabled in development mode');
  }
});