import express from "express";

const router = express.Router();

router.get("/register", (req, res) =>{
    res.send("Register endpoint");
});

router.get("/login", (req, res) =>{
    res.send("Login endpoint");
});

router.get("/logout", (req, res) =>{
    res.send("Logout endpoint");
});

export default router;