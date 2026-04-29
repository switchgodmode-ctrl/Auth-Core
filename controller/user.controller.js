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

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        let filename = `invoice-${paymentId}.pdf`;
        
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        // --- TOP BLUE HEADER ---
        doc.rect(0, 0, 600, 80).fill("#1e293b");
        doc.fillColor("#ffffff").fontSize(26).text("AUTH CORE", 40, 30, { characterSpacing: 2 });
        doc.fontSize(10).text("OFFICIAL TAX INVOICE", 40, 60, { characterSpacing: 1 });
        
        doc.fillColor("#ffffff").fontSize(10).text("switchgodmode@gmail.com", 350, 25, { align: "right" });
        doc.text("Ahmedabad, Gujarat, India", 350, 40, { align: "right" });
        doc.text("GSTIN: 24AAACN1234A1Z5", 350, 55, { align: "right" });
        doc.text("PAN: ABCDE1234F", 350, 70, { align: "right" });

        // --- CUSTOMER & BILLING INFO ---
        let infoTop = 100;
        doc.fillColor("#f1f5f9").rect(40, infoTop, 250, 90).fill();
        doc.fillColor("#1e293b").fontSize(11).text("BILL TO:", 50, infoTop + 10);
        doc.fillColor("#334155").fontSize(10).text(user.username || "Authorized User", 50, infoTop + 30);
        doc.text(user.email, 50, infoTop + 45);
        doc.text(`User ID: #USR-${user._id}`, 50, infoTop + 60);
        doc.text("Payment: Razorpay Secure Checkout", 50, infoTop + 75);

        doc.fillColor("#f1f5f9").rect(305, infoTop, 250, 90).fill();
        doc.fillColor("#1e293b").fontSize(11).text("INVOICE SUMMARY:", 315, infoTop + 10);
        doc.fillColor("#334155").fontSize(10).text(`Invoice No: #AUTH-2024-${paymentId}`, 315, infoTop + 30);
        doc.text(`Transaction ID: ${payment.paymentId || 'N/A'}`, 315, infoTop + 45);
        doc.text(`Billing Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 315, infoTop + 60);
        doc.text(`Status: COMPLETED / PAID`, 315, infoTop + 75);

        // --- MAIN BILLING TABLE ---
        let tableTop = 210;
        doc.fillColor("#1e293b").rect(40, tableTop, 515, 25).fill();
        doc.fillColor("#ffffff").fontSize(10).text("SL.", 50, tableTop + 8);
        doc.text("SERVICE DESCRIPTION", 100, tableTop + 8);
        doc.text("UNIT", 350, tableTop + 8);
        doc.text("PRICE", 400, tableTop + 8);
        doc.text("TOTAL", 480, tableTop + 8, { align: "right" });

        let rowTop = tableTop + 25;
        doc.rect(40, rowTop, 515, 40).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
        doc.fillColor("#334155").fontSize(10);
        doc.text("01", 50, rowTop + 15);
        doc.text(`${payment.planTarget} Subscription Package`, 100, rowTop + 10);
        doc.fontSize(8).text("Full access to runtime trust engine and unlimited modules", 100, rowTop + 25);
        doc.fontSize(10).text("1 MO", 350, rowTop + 15);
        doc.text(`${payment.amount / 100}.00`, 400, rowTop + 15);
        doc.text(`${payment.amount / 100}.00`, 480, rowTop + 15, { align: "right" });

        // --- PREMIUM BENEFITS SECTION (FILLING SPACE) ---
        let benefitsTop = rowTop + 50;
        doc.fillColor("#f8fafc").rect(40, benefitsTop, 250, 115).fill();
        doc.fillColor("#1e293b").fontSize(11).text("PREMIUM BENEFITS INCLUDED:", 50, benefitsTop + 8);
        doc.fillColor("#475569").fontSize(9);
        const benefits = [
            "• Unlimited Applications & Modules",
            "• Real-time Threat Intelligence",
            "• Advanced Runtime Trust Engine Rules",
            "• Enterprise Tier Priority Support",
            "• 99.9% API Uptime SLA Guarantee",
            "• Daily Security Audits & Reports"
        ];
        benefits.forEach((b, i) => doc.text(b, 55, benefitsTop + 25 + (i * 13)));

        // --- FINANCIAL SUMMARY ---
        let summaryTop = benefitsTop;
        doc.fillColor("#475569").fontSize(10).text("Sub Total:", 380, summaryTop + 8);
        doc.text(`${payment.currency} ${payment.amount / 100}.00`, 480, summaryTop + 8, { align: "right" });
        
        doc.text("Service Tax (0%):", 380, summaryTop + 20);
        doc.text("0.00", 480, summaryTop + 20, { align: "right" });
        
        doc.text("Convenience Fee:", 380, summaryTop + 35);
        doc.text("0.00", 480, summaryTop + 35, { align: "right" });

        doc.rect(370, summaryTop + 55, 185, 35).fill("#1e293b");
        doc.fillColor("#ffffff").fontSize(12).text("NET AMOUNT:", 380, summaryTop + 67);
        doc.text(`${payment.currency} ${payment.amount / 100}.00`, 480, summaryTop + 67, { align: "right" });

        // --- SECURITY & SUPPORT BOXES (FILLING SPACE) ---
        let bottomTop = 385;
        doc.rect(40, bottomTop, 515, 110).strokeColor("#e2e8f0").stroke();
        
        doc.fillColor("#1e293b").fontSize(12).text("SECURITY & COMPLIANCE", 55, bottomTop + 12);
        doc.fillColor("#475569").fontSize(9).text("This transaction was processed over a 256-bit SSL encrypted connection. Our systems are SOC2 and GDPR compliant, ensuring your data remains secure at all times.", 55, bottomTop + 30, { width: 220 });

        doc.fillColor("#1e293b").fontSize(12).text("TECHNICAL SUPPORT", 310, bottomTop + 12);
        doc.fillColor("#475569").fontSize(9).text("For any billing inquiries or technical issues, please visit our help center or email our priority support desk at switchgodmode@gmail.com. Response time: < 4 Hours.", 310, bottomTop + 30, { width: 220 });

        // --- TERMS & LEGAL ---
        doc.fillColor("#1e293b").fontSize(11).text("Terms & Conditions:", 40, 510);
        doc.fillColor("#64748b").fontSize(8);
        const terms = [
            "1. This is a computer-generated tax invoice and does not require a physical signature.",
            "2. Subscription fees are charged in advance and are non-refundable once the service is provisioned.",
            "3. The validity of this plan is 30 days from the date of payment as mentioned in the billing details.",
            "4. Users are responsible for maintaining the confidentiality of their license keys and account credentials.",
            "5. All services are governed by the AuthCore Platform Master Service Agreement and Privacy Policy.",
            "6. Any disputes arising out of this transaction shall be subject to the exclusive jurisdiction of Ahmedabad courts."
        ];
        terms.forEach((t, i) => doc.text(t, 40, 525 + (i * 11)));

        // --- FINAL SEAL OF AUTHENTICITY ---
        doc.strokeColor("#1e293b").lineWidth(2).circle(500, 610, 35).stroke();
        doc.fillColor("#1e293b").fontSize(8).text("VERIFIED", 480, 605);
        doc.text("PAYMENT", 480, 615);

        // --- FOOTER ---
        doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(40, 740).lineTo(555, 740).stroke();
        doc.fillColor("#94a3b8").fontSize(10).text("AUTHENTICATED BY AUTH CORE SECURITY ENGINE", 40, 755, { align: "center", width: 515 });

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error("Invoice Error:", error);
        res.status(500).send("Error generating invoice");
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserSchemaModule.find({}, { password: 0, sessions: 0, activityLogs: 0 });
        res.status(200).json({ status: true, users });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

export const toggleSdkAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { sdkAccess } = req.body;
        
        const user = await UserSchemaModule.findOne({ _id: id });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        
        user.sdkAccess = sdkAccess;
        await user.save();
        
        res.status(200).json({ status: true, message: "SDK access updated successfully", sdkAccess: user.sdkAccess });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};
