import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.ts";
import * as GenerateController from "../controllers/generate.ts";
import { generateKey } from "crypto";
const GenerateRouter = Router();

GenerateRouter.post(
  "/generate",
  authenticateToken,
  GenerateController.handleGenerateQuestions
);

GenerateRouter.get(
  "/lastQuestions",
  authenticateToken,
  GenerateController.exportLastQuestions
);
export default GenerateRouter;
