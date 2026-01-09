
import { TokenService } from "./src/services/token.service.js";

async function testBasique() {
  console.log("TEST DU TOKEN SERVICE");
  
  // test 1 genération de token
  console.log("\n1. Génération de token :");
  const token = TokenService.generateToken();
  console.log("Token généré :", token.substring(0, 20) + "...");
  console.log("Longueur :", token.length, "caractères");
  
  // test 2 Creation dans la base (simulé)
  console.log("\n2. Vérification (simulée) :");
  const verification = await TokenService.verifyToken("token_inexistant");
  console.log("Token inexistant :", verification);
  
  console.log("\n Tests OK !");
}

testBasique().catch(console.error);