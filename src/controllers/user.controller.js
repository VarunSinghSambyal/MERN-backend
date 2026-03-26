import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  //Steps to register a user

  //   Step 1: Get user input from req.body
  const { username, email, password, fullName } = req.body;

  //   Step 2: Validate user inputs (e.g., check if email is valid, password meets criteria, etc.)
  if (
    [username, email, password, fullName].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //   Step 3: Check if the user already exists in the database (e.g., by email or username)
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  //   Step 4: Handle file uploads for avatar and cover image using Multer middleware (already handled in the route)
  const avatarFileLocalURL = req.files?.avatar?.[0]?.path || null;
  const coverImageFileLocalURL = req.files?.coverImage?.[0]?.path || null;

  // Step 5: upload it to cloudinary and get the url
  if (!avatarFileLocalURL) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatarURL = await uploadToCloudinary(avatarFileLocalURL);
  const coverImageURL = await uploadToCloudinary(coverImageFileLocalURL);

  if (!avatarURL) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  //   Step 6: Create a new user in the database with the provided information and the URLs of the uploaded images
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullName,
    avatar: avatarURL.url,
    coverImage: coverImageURL?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }
  //   Step 7: Return a success response with the created user's information (excluding sensitive data like password)
  return new ApiResponse(201, "User registered successfully", createdUser).send(res);
});
