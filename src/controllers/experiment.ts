import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";


export const payment = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {


});
