const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { Resend } = require("resend");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// RESEND
// ===============================

const resend = new Resend(process.env.RESEND_API_KEY);


// ===============================
// USER SCHEMA
// ===============================

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const User = mongoose.model("User", userSchema);


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {

    res.send("Akhilesh Portfolio Server is Running!");

});


// ===============================
// REGISTER
// ===============================

app.post("/api/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;


        // Check fields

        if (!name || !email || !password) {

            return res.status(400).json({
                message: "All fields are required"
            });

        }


        // Check password length

        if (password.length < 6) {

            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });

        }


        // Check existing user

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json({
                message: "Email already registered"
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user

        const user = new User({

            name: name,

            email: email,

            password: hashedPassword

        });


        // Save user

        await user.save();


        console.log(
            "New user registered:",
            email
        );


        // ===============================
        // SEND EMAIL
        // ===============================

        try {

            await resend.emails.send({

                from: "onboarding@resend.dev",

                to: process.env.ADMIN_EMAIL,

                subject: "New Portfolio Registration",

                html: `
                    <h2>New User Registered</h2>

                    <p><strong>Name:</strong> ${name}</p>

                    <p><strong>Email:</strong> ${email}</p>

                    <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
                `

            });

            console.log("Registration email sent successfully.");

        } catch (emailError) {

            console.error(
                "Email Error:",
                emailError.message
            );

        }


        // Send success response

        res.status(201).json({

            message: "Registration successful"

        });


    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        res.status(500).json({

            message: "Server error"

        });

    }

});


// ===============================
// LOGIN
// ===============================

app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Email and password are required"

            });

        }


        // Find user

        const user =
            await User.findOne({ email });


        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }


        // Compare password

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }


        console.log(
            "User logged in:",
            email
        );


        res.json({

            message:
                "Login successful",

            user: {

                name: user.name,

                email: user.email

            }

        });


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        res.status(500).json({

            message:
                "Server error"

        });

    }

});


// ===============================
// START SERVER
// ===============================

async function startServer() {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );


        console.log(
            "MongoDB Connected Successfully"
        );


        app.listen(
            process.env.PORT || 5000,
            () => {

                console.log(
                    "Server running on port 5000"
                );

            }
        );


    } catch (error) {

        console.error(
            "MongoDB Connection Error:"
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}


startServer();