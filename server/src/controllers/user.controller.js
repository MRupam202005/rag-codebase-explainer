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
        <h1>Email Verification</h1>
        <p>Please go to this link to verify your email address:</p>
        <a href=${verificationUrl} clicktracking=off>${verificationUrl}</a>
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
})

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
})

export {registerUser,loginUser, logoutUser, verifyEmail, refreshAccessToken }
    
































// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import sendEmail from '../utils/sendEmail.js';

// // Generate JWT
// const generateToken = (id) => {
//     // Uses a fallback secret for development if JWT_SECRET is not set
//     const secret = process.env.JWT_SECRET || 'fallback_dev_secret_key_12345';
//     return jwt.sign({ id }, secret, { expiresIn: '30d' });
// };

// // @desc    Register a new user
// // @route   POST /api/auth/register
// export const registerUser = async (req, res) => {
//     try {
//         const { name, email, password } = req.body;

//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ error: 'User already exists' });
//         }

//         // Generate a random verification token
//         const verificationToken = crypto.randomBytes(20).toString('hex');

//         const user = await User.create({
//             name,
//             email,
//             password,
//             verificationToken
//         });

//         // Send Verification Email
//         const verifyUrl = `http://localhost:5173/verify/${verificationToken}`;
//         const message = `
//             <h2>Welcome to RAG Codebase Explainer, ${name}!</h2>
//             <p>Please click the link below to verify your email account:</p>
//             <a href="${verifyUrl}" target="_blank">Verify Email</a>
//         `;

//         await sendEmail({
//             email: user.email,
//             subject: 'Email Verification - RAG Codebase Explainer',
//             message
//         });

//         res.status(201).json({
//             message: 'User registered. Please check your email to verify your account.'
//         });

//     } catch (error) {
//         console.error("Register Error Type:", typeof error);
//         console.error("Register Error Raw:", error);
//         res.status(500).json({ error: 'Server error during registration.', rawError: String(error), stack: error.stack });
//     }
// };

// // @desc    Verify Email Token
// // @route   GET /api/auth/verify/:token
// export const verifyEmail = async (req, res) => {
//     try {
//         const { token } = req.params;

//         const user = await User.findOne({ verificationToken: token });
//         if (!user) {
//             return res.status(400).json({ error: 'Invalid or expired verification token' });
//         }

//         user.isVerified = true;
//         user.verificationToken = undefined;
//         await user.save();

//         res.status(200).json({
//             message: 'Email verified successfully! You can now log in.',
//             token: generateToken(user._id),
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email
//             }
//         });

//     } catch (error) {
//         console.error("Verification Error:", error);
//         res.status(500).json({ error: 'Server error during email verification.' });
//     }
// };

// // @desc    Auth user & get token
// // @route   POST /api/auth/login
// export const loginUser = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(401).json({ error: 'Invalid email or password' });
//         }

//         const isMatch = await user.matchPassword(password);
//         if (!isMatch) {
//             return res.status(401).json({ error: 'Invalid email or password' });
//         }

//         if (!user.isVerified) {
//             return res.status(401).json({ error: 'Please verify your email before logging in.' });
//         }

//         res.json({
//             token: generateToken(user._id),
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email
//             }
//         });

//     } catch (error) {
//         console.error("Login Error:", error);
//         res.status(500).json({ error: 'Server error during login.' });
//     }
// };
