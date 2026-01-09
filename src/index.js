import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { logger } from "#lib/logger";
// import { startJobs } from "./jobs/cleanup.job.js"; // Temporairement désactivé

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`);
  
  // // Demos des endpoints de tokens et sessions par Jp-perso3
  // console.log("   POST   /auth/refresh     - Rafraîchir access token");
  // console.log("   GET    /auth/sessions    - Voir sessions actives");
  // console.log("   DELETE /auth/sessions/:id - Déconnecter une session");
  // console.log("   DELETE /auth/sessions/others - Déconnecter autres sessions");
  
  // Start cron jobs only in production (temporairement désactivé)
  // if (process.env.NODE_ENV === 'production') {
  //   startJobs();
  //   logger.info('Cron jobs started');
  // } else {
  logger.info('Cron jobs disabled in development mode');
  // }
});