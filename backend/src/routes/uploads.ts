import { Router } from "express";
import { z } from "zod";
import { createUploadUrl } from "../services/s3";

const router = Router();

router.get("/presign", async (req, res, next) => {
  try {
    const schema = z.object({
      contentType: z.string().min(1),
      folder: z.string().optional(),
    });

    const { contentType, folder } = schema.parse(req.query);
    const result = await createUploadUrl(contentType, folder);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;