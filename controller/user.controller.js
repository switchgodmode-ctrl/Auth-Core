import "../module/connection.js";

import UserSchemaModule from "../module/user.module.js";

import rs from 'randomstring'

import jwt from 'jsonwebtoken';

import sendMail from "../nodemailer/mailer.js";
import PaymentModule from "../module/payment.module.js";
import bcrypt from 'bcrypt';
import PDFDocument from 'pdfkit';

export const googleLogin = async (req, res) => {
    try {

        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ status: false, error: "idToken required" });

        const resp = await globalThis.fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!resp.ok) return res.status(401).json({ status: false, error: "invalid_google_token" });

        const info = await resp.json();

        const aud = info.aud || "";
        const clientId = process.env.GOOGLE_CLIENT_ID || "";
        if (clientId && aud !== clientId) {
            console.error("Google Auth Mismatch: aud=" + aud + ", env.GOOGLE_CLIENT_ID=" + clientId);
            return res.status(401).json({ status: false, error: "aud_mismatch" });
        }

        const email = info.email || "";
        const name = info.name || (email ? email.split("@")[0] : "user");
        if (!email) return res.status(400).json({ status: false, error: "email_missing" });

        let user = await UserSchemaModule.findOne({ email });
        if (!user) {

            const users = await UserSchemaModule.find();
            const _id = users.length === 0 ? 1 : users[users.length - 1]._id + 1;

            const saltRounds = 10;

            const hashedPassword = await bcrypt.hash(rs.generate(12), saltRounds);

            user = await UserSchemaModule.create({
                _id,
                username: name,
                email,
                password: hashedPassword,
                plan: "Free",
                status: 1,
                role: "user",
                referralCode: rs.generate({ length: 8, charset: 'alphanumeric' }).toUpperCase(),
                info: new Date(),
                verifiedAt: new Date(),
                verificationToken: ""
            });
        } else if (user.status !== 1) {

            user.status = 1;
            user.verifiedAt = new Date();
            await user.save();
        }

        const payload = { email: user.email, id: user._id, plan: user.plan, role: user.role };
        const key = process.env.JWT_SECRET || "dev_secret";

        const token = jwt.sign(payload, key, { expiresIn: "15m" });
        const refreshToken = rs.generate(40);

        // Record Session & Activity
        const device = req.headers['user-agent'] || 'Unknown Device';
        user.sessions.push({ token: refreshToken, device, ip: req.ip });
        if (user.sessions.length > 5) user.sessions.shift();
        user.activityLogs.push({ action: "Google Login", ip: req.ip, details: `Logged in via Google from ${device}` });

        await UserSchemaModule.updateOne({ _id: user._id }, { 
            $set: { refreshToken, sessions: user.sessions, activityLogs: user.activityLogs } 
        });

        return res.status(200).json({ status: true, token, refreshToken, info: user });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};

export const save = async (req, res) => {
    try {
        const existingUser = await UserSchemaModule.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ status: false, error: "Email already registered" });
        }

        const users = await UserSchemaModule.find();
        const l = users.length;
        const _id = l === 0 ? 1 : users[l - 1]._id + 1;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const verificationToken = rs.generate(48);
        const myReferralCode = rs.generate({ length: 8, charset: 'alphanumeric' }).toUpperCase();
        
        let referredBy = null;
        if (req.body.referralCode) {
            const referrer = await UserSchemaModule.findOne({ referralCode: req.body.referralCode });
            if (referrer) referredBy = referrer._id;
        }

        const userDetails = { 
            ...req.body, 
            password: hashedPassword, 
            _id, 
            role: "user", 
            status: 0, 
            info: new Date(), 
            plan: req.body.plan || "Free", 
            verificationToken,
            referralCode: myReferralCode,
            referredBy
        };

        await UserSchemaModule.create(userDetails);
        
        const base = process.env.APP_BASE_URL || "http://localhost:3001";
        const verifyLink = `${base}/user/verify?email=${encodeURIComponent(req.body.email)}&token=${verificationToken}`;
        
        console.log("Sending verification mail to:", req.body.email);
        
        try {
            await sendMail(req.body.email, verifyLink);
        } catch (mailError) {
            console.error("Mail Error:", mailError);
        }

        res.status(200).json({ status: true, message: "Registration successful. Please verify your email." });

    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ status: false, error: err.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserSchemaModule.findOne({ email, status: 1 });
        if (user) {
            const ok = await bcrypt.compare(password, user.password);
            if (!ok) {
                return res.status(401).json({ "status": false, message: "Invalid credentials" });
            }
            
            const payload = { email: user.email, id: user._id, plan: user.plan, role: user.role };
            const key = process.env.JWT_SECRET || "dev_secret";
            const token = jwt.sign(payload, key, { expiresIn: "15m" });
            const refreshToken = rs.generate(40);

            // Safety check for arrays (prevents 500 error if they are missing)
            if (!user.sessions) user.sessions = [];
            if (!user.activityLogs) user.activityLogs = [];

            // Record Session & Activity
            const device = req.headers['user-agent'] || 'Unknown Device';
            user.sessions.push({ token: refreshToken, device, ip: req.ip });
            if (user.sessions.length > 5) user.sessions.shift();
            user.activityLogs.push({ action: "Login", ip: req.ip, details: `Logged in from ${device}` });
            
            await UserSchemaModule.updateOne({ _id: user._id }, { 
                $set: { refreshToken, sessions: user.sessions, activityLogs: user.activityLogs } 
            });

            return res.status(200).json({ "status": true, "token": token, "refreshToken": refreshToken, "info": user });
        } else {
            return res.status(404).json({ "status": false, message: "User not found or not verified" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

export const verify = async (req, res) => {
    try {
        const { email, token } = req.query;
        if (!email || !token) {
            return res.status(400).send("Invalid verification link");
        }
        const user = await UserSchemaModule.findOne({ email, verificationToken: token, status: 0 });
        if (!user) {
            return res.status(404).send("Verification failed or already verified");
        }
        user.status = 1;
        user.verifiedAt = new Date();
        user.verificationToken = "";
        await user.save();

        const uiBase = process.env.UI_BASE_URL || "http://localhost:5173";
        // Redirect to login page on the UI
        return res.redirect(`${uiBase}/login?verified=true`);
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).send("Internal server error");
    }
    
}

export const fetch = async (req, res) => {
    var condition_obj = req.query.condition_obj;
    if (condition_obj != undefined) {
        condition_obj = JSON.parse(condition_obj)
    }
    else
        condition_obj = {}
    var userList = await UserSchemaModule.find(condition_obj);
    if (userList.length != 0) {
        res.status(200).json({ "status": true, "info": userList })
    }
    else
        res.status(404).json({ "status": false });

}

export const deleteUser = async (req, res) => {
    try {
        if (!req.body || typeof req.body.condition_obj !== "string") {
            return res.status(400).json({ "status": false, "message": "condition_obj required" });
        }
        let condition;
        try { condition = JSON.parse(req.body.condition_obj); } catch { return res.status(400).json({ "status": false, "message": "Invalid condition_obj" }); }
        let userDetails = await UserSchemaModule.findOne(condition);

        if (userDetails) {
            let user = await UserSchemaModule.deleteOne(condition);
            {
                if (user)
                    res.status(200).json({ "status": true })
                else
                    res.status(404).json({ "status": false })
            }
        }
        else
            res.status(404).json({ "message": "user not found" })
    }
    catch (error) {
        res.status(500).json({ "status": false });
    }
}

export const update = async (req, res) => {
    try {
        if (!req.body || typeof req.body.condition_obj !== "string" || typeof req.body.content_obj !== "string") {
            return res.status(400).json({ "status": false, "Message": "condition_obj and content_obj required" });
        }
        let condition, content;
        try { condition = JSON.parse(req.body.condition_obj); } catch { return res.status(400).json({ "status": false, "Message": "Invalid condition_obj" }); }
        try { content = JSON.parse(req.body.content_obj); } catch { return res.status(400).json({ "status": false, "Message": "Invalid content_obj" }); }
        let userDetails = await UserSchemaModule.find(condition);
        if (userDetails) {
            let user = await UserSchemaModule.updateMany(condition, { $set: content });
            if (user)
                res.status(200).json({ "status": true, "Message": "Update Successfully..." });
            else
                res.status(404).json({ "Message": "user not found" })
        }
        else
            res.status(400).json({ "status": false, "Message": "userDetails not found" });
    }
    catch (error) {
        res.status(500).json({ "status": false });
    }
}

export const refresh = async (req, res) => {
    try {
        const { email, refreshToken } = req.body;
        const user = await UserSchemaModule.findOne({ email, refreshToken, status: 1 });
        if (!user) return res.status(401).json({ status: false });
        const key = process.env.JWT_SECRET || "dev_secret";
        const payload = { email: user.email, id: user._id, plan: user.plan };
        const token = jwt.sign(payload, key, { expiresIn: "15m" });
        res.status(200).json({ status: true, token });
    } catch (error) {
        res.status(500).json({ status: false });
    }
}

export const resendVerify = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserSchemaModule.findOne({ email });
        if (!user) return res.status(404).json({ status: false });
        if (user.status === 1) return res.status(200).json({ status: true, message: "Already verified" });
        let token = user.verificationToken;
        if (!token || token.length < 10) {
            token = rs.generate(48);
            user.verificationToken = token;
            await user.save();
        }
        const base = process.env.APP_BASE_URL || "http://localhost:3001";
        const verifyLink = `${base}/user/verify?email=${encodeURIComponent(email)}&token=${token}`;
        await sendMail(email, verifyLink, "verify");
        res.status(200).json({ status: true, verifyLink });
    } catch (error) {
        res.status(500).json({ status: false });
    }
}

export const googleClient = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID || "";
        console.log("Serving Google Client ID:", clientId ? "EXISTS" : "MISSING");
        res.status(200).json({ status: true, clientId });
    } catch (error) {
        console.error("googleClient Error:", error);
        res.status(500).json({ status: false });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: false, message: "email required" });
        const user = await UserSchemaModule.findOne({ email });
        const token = rs.generate(48);
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        if (user) {
            user.resetToken = token;
            user.resetExpires = expires;
            await user.save();
            const base = process.env.UI_BASE_URL || "http://localhost:5173";
            const link = `${base}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
            await sendMail(email, link, "reset");
        }
        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, token, password } = req.body;
        if (!email || !token || !password) return res.status(400).json({ status: false, message: "email, token and password required" });
        const user = await UserSchemaModule.findOne({ email, resetToken: token });
        if (!user || !user.resetExpires || new Date() > new Date(user.resetExpires)) {
            return res.status(400).json({ status: false, message: "invalid_or_expired_token" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user.password = hashedPassword;
        user.resetToken = "";
        user.resetExpires = null;
        user.refreshToken = "";
        await user.save();
        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        if (!userId) return res.status(401).json({ status: false });
        const user = await UserSchemaModule.findOne({ _id: userId });
        if (!user) return res.status(404).json({ status: false });
        user.refreshToken = "";
        await user.save();
        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false });
    }
};

export const mailTest = async (req, res) => {
    try {
        const { to } = req.body;
        if (!to) return res.status(400).json({ status: false, message: "to required" });
        const ui = process.env.UI_BASE_URL || "http://localhost:5173";
        const link = `${ui}/login`;
        await sendMail(to, link, "verify");
        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

// --- NEW PROFILE & SESSION FEATURES ---

export const updateProfile = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await UserSchemaModule.findById(req.user.id);
        if (!user) return res.status(404).json({ status: false, message: "user_not_found" });

        if (username) user.username = username;
        if (req.file) {
            user.avatar = `/uploads/avatars/${req.file.filename}`;
        }

        user.activityLogs.push({
            action: "Profile Updated",
            ip: req.ip,
            details: "Updated username or avatar"
        });

        await user.save();
        return res.status(200).json({ status: true, info: user });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await UserSchemaModule.findById(req.user.id);
        
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ status: false, message: "incorrect_old_password" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.activityLogs.push({ action: "Password Changed", ip: req.ip });
        
        await user.save();
        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};

export const getSessions = async (req, res) => {
    try {
        const user = await UserSchemaModule.findById(req.user.id).select('sessions');
        return res.status(200).json({ status: true, sessions: user.sessions });
    } catch (error) {
        return res.status(500).json({ status: false });
    }
};

export const logoutDevice = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const user = await UserSchemaModule.findById(req.user.id);
        user.sessions = user.sessions.filter(s => s._id.toString() !== sessionId);
        await user.save();
        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. User Growth (Last 7 days)
        const userGrowth = await UserSchemaModule.aggregate([
            { $match: { info: { $gte: sevenDaysAgo.toISOString() } } },
            { $group: { 
                _id: { $substr: ["$info", 0, 10] }, 
                count: { $sum: 1 } 
            }},
            { $sort: { _id: 1 } }
        ]);

        // 2. Revenue Growth (Last 7 days)
        const revenueGrowth = await PaymentModule.aggregate([
            { $match: { status: "paid", createdAt: { $gte: sevenDaysAgo } } },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                total: { $sum: "$amount" } 
            }},
            { $sort: { _id: 1 } }
        ]);

        // 3. Plan Distribution
        const planStats = await UserSchemaModule.aggregate([
            { $group: { _id: "$plan", count: { $sum: 1 } } }
        ]);

        // 4. Global Totals
        const totalUsers = await UserSchemaModule.countDocuments();
        const totalRevenue = await PaymentModule.aggregate([
            { $match: { status: "paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return res.status(200).json({
            status: true,
            stats: {
                userGrowth,
                revenueGrowth,
                planStats,
                totals: {
                    users: totalUsers,
                    revenue: totalRevenue[0]?.total || 0
                }
            }
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};export const downloadInvoice = async (req, res) => {
    try {
        const { paymentId } = req.query;
        const payment = await PaymentModule.findOne({ _id: Number(paymentId), status: "paid" });
        if (!payment) return res.status(404).send("Invoice not found or payment not completed");

        const user = await UserSchemaModule.findOne({ _id: Number(payment.userId) });

        const doc = new PDFDocument({ margin: 50 });
        let filename = `invoice-${paymentId}.pdf`;
        
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        // --- HEADER ---
        doc.fillColor("#444444").fontSize(20).text("AUTH PLATFORM", 50, 57);
        doc.fillColor("#444444").fontSize(10).text("switchgodmode@gmail.com", 200, 65, { align: "right" });
        doc.text("Ahmedabad, Gujarat, India", 200, 80, { align: "right" });
        doc.moveDown();

        // --- DIVIDER ---
        doc.strokeColor("#eeeeee").lineWidth(1).moveTo(50, 100).lineTo(550, 100).stroke();

        // --- BILL TO ---
        doc.fillColor("#444444").fontSize(14).text("Invoice", 50, 120);
        doc.fontSize(10).text(`Invoice Number: INV-${paymentId}`, 50, 140);
        doc.text(`Invoice Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 50, 155);
        doc.text(`Payment Status: ${payment.status.toUpperCase()}`, 50, 170);

        doc.fontSize(12).text("Bill To:", 350, 120);
        doc.fontSize(10).text(user.username || "Customer", 350, 140);
        doc.text(user.email, 350, 155);

        // --- TABLE HEADER ---
        let tableTop = 230;
        doc.fillColor("#f6f6f6").rect(50, tableTop, 500, 25).fill();
        doc.fillColor("#444444").fontSize(10).text("Description", 60, tableTop + 8);
        doc.text("Currency", 300, tableTop + 8);
        doc.text("Amount", 450, tableTop + 8, { align: "right" });

        // --- TABLE ROW ---
        let rowTop = tableTop + 35;
        doc.text(`${payment.planTarget} Subscription Package`, 60, rowTop);
        doc.text(payment.currency, 300, rowTop);
        doc.text(`${payment.amount / 100}.00`, 450, rowTop, { align: "right" });

        doc.strokeColor("#eeeeee").lineWidth(1).moveTo(50, rowTop + 20).lineTo(550, rowTop + 20).stroke();

        // --- TOTAL ---
        doc.fontSize(12).text("Total Amount Paid:", 350, rowTop + 50);
        doc.fontSize(12).fillColor("#2563eb").text(`${payment.currency} ${payment.amount / 100}.00`, 450, rowTop + 50, { align: "right" });

        // --- TERMS & POLICY ---
        doc.fillColor("#444444").fontSize(12).text("Terms & Conditions", 50, 550);
        doc.fontSize(8).text("1. This is a computer generated invoice and does not require a physical signature.", 50, 570);
        doc.text("2. Subscription plans are non-refundable once activated.", 50, 582);
        doc.text("3. The services are provided as-is under the AuthCore usage policy.", 50, 594);
        doc.text("4. For any billing queries, please contact switchgodmode@gmail.com.", 50, 606);

        // --- FOOTER ---
        doc.fontSize(10).fillColor("#999999").text("Thank you for using Auth Platform!", 50, 720, { align: "center", width: 500 });

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error("Invoice Error:", error);
        res.status(500).send("Error generating invoice");
    }
};
