import Router from "express";
import { queryValidation, validateValidation } from "../middlewares/query";
import { queryHandler, validateHandler } from "../controllers/query";

const router = Router();

router.post("/query", queryValidation, queryHandler);

router.post("/validate", validateValidation, validateHandler);

export default router;
