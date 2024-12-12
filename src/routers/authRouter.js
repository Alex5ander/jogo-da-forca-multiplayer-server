import { json, Router } from "express";
import { AuthController } from "../controllers/authController.js";

const router = Router();
router.use(json());
router.post('/signup', AuthController.signup);
router.post('/signin', AuthController.signin);
router.get('/auth', AuthController.getUser)

export default router;