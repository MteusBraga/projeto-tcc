import { Request, Response, Router } from "express";
import UserRouter from "./user.ts";
import GenerateRouter from "./generate.ts";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  res.status(200).send("Healthy App :)");
});

router.use(UserRouter).use(GenerateRouter);
export default router;
