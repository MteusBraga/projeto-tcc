import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.ts";
import * as GenerateController from "../controllers/generate.ts";
const GenerateRouter = Router();

GenerateRouter.post(
  "/generate",
  authenticateToken,
  GenerateController.handleGenerateQuestions
);

export default GenerateRouter;
