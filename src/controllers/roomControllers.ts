import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";

export const photoUploadsController = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

})
