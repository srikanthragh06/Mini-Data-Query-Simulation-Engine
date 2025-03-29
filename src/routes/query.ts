import Router from "express";
import { queryValidation } from "../middlewares/query";
import {
    explainHandler,
    queryHandler,
    validateHandler,
} from "../controllers/query";

const router = Router();

router.post("/query", queryValidation, queryHandler);

router.post("/validate", queryValidation, validateHandler);

router.post("/explain", queryValidation, explainHandler);

export default router;
