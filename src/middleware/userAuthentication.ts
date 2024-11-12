import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "./errorHandler.js";


const secretKey = process.env.JWT_SECRET as string;
export const userAuthenticate = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {





})