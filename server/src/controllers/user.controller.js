import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });          // validateBeforeSave: false is used to bypass the validation of the model (like password length, email format, etc) when saving the user (because we are not sending the password and refresh token from the frontend)

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ApiError(400, "User already exists");
    }


    const verifyToken = crypto.randomBytes(20).toString("hex");
    const newUser = await User.create({
        name,
        email,
        password,
        verifyToken,
        verifyTokenExpiry: Date.now() + 3600000
    });

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken -verifyToken -verifyTokenExpiry");

    if (!createdUser) {
        return res.status(400).json(new ApiResponse(400, {}, "Something went wrong while registering the user"));
    } 

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify/${verifyToken}`;
    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #111827; margin-bottom: 5px;">RAG Codebase Explainer</h1>
                <p style="color: #6b7280; font-size: 16px; margin-top: 0;">AI-Powered Code Analysis</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}! 👋</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Thanks for signing up! To get started exploring and querying repositories with AI, please verify your email address by clicking the button below.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" clicktracking="off" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Verify My Account
                    </a>
                </div>
                <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #4f46e5;">${verificationUrl}</a>
                </p>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                This link will expire in 1 hour. If you did not create this account, please ignore this email.
            </p>
        </div>
    `;

    try {
        await sendEmail({
            email: newUser.email,
            subject: "RAG Codebase Explainer - Verify your email",
            message
        });
    } catch (error) {
        newUser.verifyToken = undefined;
        newUser.verifyTokenExpiry = undefined;
        await newUser.save({ validateBeforeSave: false });
        throw new ApiError(500, "Something went wrong while sending verification email")
    }

    // send the response (only 201 code)
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully. Please check your email to verify your account."));
});


const verifyEmail = asyncHandler(async (req, res) => {
    const token = req.params.token || req.body.token;

    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    const user = await User.findOne({
        verifyToken: token,
        verifyTokenExpiry: { $gt: Date.now() } // Ensure token hasn't expired
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "Email verified successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }
    if(!user.isEmailVerified){
        throw new ApiError(400, "Email not verified. Please verify your email to login");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 1000 * 60 * 60 * 24
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser,   // If we want to access the user object in frontend we send it, or else we can just send the tokens(but user is still needed for the navbar, etc)
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        ))
});


const logoutUser = asyncHandler(async (req, res) => {
    // Update the refresh token in the database to null
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        { returnDocument: "after" }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
        };

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    const verifyToken = crypto.randomBytes(20).toString("hex");
    user.verifyToken = verifyToken;
    user.verifyTokenExpiry = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify/${verifyToken}`;
    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #111827; margin-bottom: 5px;">RAG Codebase Explainer</h1>
                <p style="color: #6b7280; font-size: 16px; margin-top: 0;">AI-Powered Code Analysis</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome back, ${user.name}! 👋</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                    You requested a new verification link. Please verify your email address by clicking the button below.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" clicktracking="off" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Verify My Account
                    </a>
                </div>
                <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #4f46e5;">${verificationUrl}</a>
                </p>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                This link will expire in 1 hour. If you did not request this, please ignore this email.
            </p>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: "RAG Codebase Explainer - Verify your email (Resend)",
            message
        });
    } catch (error) {
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Something went wrong while sending verification email")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Verification email resent successfully"));
});

export {registerUser,loginUser, logoutUser, verifyEmail, refreshAccessToken, resendVerificationEmail }
