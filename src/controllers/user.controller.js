import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { jwt } from "jsonwebtoken";

const generateAccessandRefershTokens = async (foundUser) => {
  const accessToken = await foundUser.generateAccessToken();
  const refreshToken = await foundUser.generateRefreshToken();

  //    Step 6: Store the refresh token in the database associated with the user (optional but recommended for security)
  foundUser.refreshToken = refreshToken;
  await foundUser.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

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
  return res
    .status(201)
    .json(new ApiResponse(200, "User registered successfully", createdUser));
});

export const LoginUser = asyncHandler(async (req, res) => {
  //    Steps to login a user
  //    Step 1: Get user input from req.body
  
  const { email, username, password } = req.body;

  //    Step 2: Validate user inputs (e.g., check if email is valid, password is provided, etc.)
  if (email.trim() === "" || username.trim() === "") {
    throw new ApiError(400, "Email or Username are required");
  }

  //    Step 3: Check if the user exists in the database by email or username
  const foundUser = await User.findOne({ $or: [{ email }, { username }] });
  if (!foundUser) {
    throw new ApiError(
      404,
      "User not found with the provided email or username"
    );
  }

  //    Step 4: If user exists, compare the provided password with the stored hashed password using bcrypt
  const isPasswordMatch = await foundUser.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid password");
  }

  //    Step 5: If password matches, generate an access token and a refresh token for the user using JWT
  const { accessToken, refreshToken } = await
    generateAccessandRefershTokens(foundUser);

  //  step 7: Save access and refresh tokens in httpOnly cookies (optional but recommended for security)
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Set to true if using HTTPS
  };

  //    Step 8: Return a success response with the generated tokens and user information (excluding sensitive data like password)
  const userData = {
    _id: foundUser._id,
    email: foundUser.email,
    username: foundUser.username,
    fullName: foundUser.fullName,
    avatar: foundUser.avatar,
    coverImage: foundUser.coverImage,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        userData,
        accessToken,
        refreshToken,
      })
    );
});

export const LogoutUser = asyncHandler(async (req, res) => {
  // Steps to logout a user
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true, // Set to true if using HTTPS
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

export const RefreshToken = asyncHandler(async (req, res) => {
    // Steps to refresh access token using refresh token
    // Step 1: Get the refresh token from the request (e.g., from cookies or request body)

    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(refreshToken.trim() === "") {
        throw new ApiError(400, "Refresh token is required");
    }

    // Step 2: Validate the refresh token (e.g., check if it's valid and not expired)
    try{
        const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // Step 3: If the refresh token is valid, generate a new access token for the user
        const user = await User.findById(decodedToken._id);
        if(!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessandRefershTokens(user);

        const cookieOptions = {
            httpOnly: true,
            secure: true, // Set to true if using HTTPS
        };
        // Step 4: Return a success response with the new access token and optionally a new refresh token
        return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new ApiResponse(200, "Refresh token refreshed successfully", { accessToken, refreshToken: newRefreshToken }));

    }catch(error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});
