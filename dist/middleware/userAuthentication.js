import { tryCatchFunction } from "./errorHandler.js";
const secretKey = process.env.JWT_SECRET;
export const userAuthenticate = tryCatchFunction(async (req, res, next) => {
    console.log("fhkgk");
});
