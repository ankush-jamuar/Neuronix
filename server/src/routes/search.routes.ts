import express from "express";
import { searchController } from "../controllers/search.controller";
import { requireAuth } from "@clerk/express";

const router = express.Router();

router.get("/", requireAuth(),  searchController);

export default router;