// Rotas de autenticação
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import * as UserController from "../controllers/user.ts";

const UserRouter = Router();

UserRouter.post("/register", UserController.handleSignUp);

UserRouter.post("/login", UserController.handleSignIn);

export default UserRouter;
