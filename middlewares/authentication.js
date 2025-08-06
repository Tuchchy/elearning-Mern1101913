function authMiddleware(req,res,next) {
    const authHeader = req.headers["authorization"];
    // const token = authHeader?.split(" ")[1];
    // if (!token) return res.status(401).json({ message: "Token required" });
    if (authHeader) {
        console.log(authHeader);
    }

    return next()
}

module.exports = {authMiddleware}