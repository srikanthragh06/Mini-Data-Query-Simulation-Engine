import Router from "express";
import { queryValidation } from "../middlewares/query";
import { queryHandler } from "../controllers/query";

const router = Router();

router.post("/query", queryValidation, queryHandler);

export default router;
