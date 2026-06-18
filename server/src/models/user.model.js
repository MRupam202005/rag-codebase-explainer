import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verifyToken: String,
    verifyTokenExpiry: Date,
}, { timestamps: true });

// Before saving the user, we need to hash the password 
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;                             // if the password is not modified, then we don't need to hash it
    this.password = await bcrypt.hash(this.password, 10);                  // hashing the password
})

// methods
userSchema.methods.isPasswordCorrect = async function (password) {  // it is for : userController.login to check if the password is correct (comparing entered password with the hashed password)
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {   // creating access token using jwt
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET,   // this is the secret key which is used to sign the JWT token (it is kept secret) 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY   // this is the expiry time for the JWT token 
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);

// // Pre-save middleware to hash the password before saving
// userSchema.pre('save', function(next) {
//     // Only hash the password if it has been modified (or is new)
//     if (!this.isModified('password')) return next();

//     bcrypt.genSalt(10, (err, salt) => {
//         if (err) return next(err);
//         bcrypt.hash(this.password, salt, (err, hash) => {
//             if (err) return next(err);
//             this.password = hash;
//             next();
//         });
//     });
// });

// // Method to compare passwords
// userSchema.methods.matchPassword = async function(enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', userSchema);
// export default User;
