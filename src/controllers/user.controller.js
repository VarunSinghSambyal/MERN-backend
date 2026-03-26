import { asyncHandler } from "../utils/asyncHandler.js";

export const registerUser = asyncHandler((req, res)=>{
    res.status(400).json({message: "Abi ye sirf ek test route hai, isme kuch bhi nahi hai"});
    res.end();
})