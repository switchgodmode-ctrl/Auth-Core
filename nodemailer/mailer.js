import nodemailer from 'nodemailer';

async function sendMail(email, link, type = "verify") {
   if (!email) return; 
   const user = process.env.MAIL_USER || process.env.user || process.env.EMAIL_USER || "";
   const pass = process.env.MAIL_PASS || process.env.pass || process.env.EMAIL_PASS || "";
   
   if (!user || !pass) {
     console.error("Mail Error: MAIL_USER or MAIL_PASS not set in environment.");
     return;
   }

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });

    try {
      await transporter.verify();
      console.log("SMTP ready as", user);
    } catch (err) {
      console.error("SMTP_VERIFY_ERROR:", err.message);
    }

   const isVerify = type === "verify";
   const isReset = type === "reset";
   const isInvoice = type === "invoice";
   
   let subject = 'Auth Platform Notification';
   if (isVerify) subject = 'Verify Your Auth Account';
   if (isReset) subject = 'Reset Your Auth Password';
   if (isInvoice) subject = 'Your Payment Invoice - Auth Platform';

   const actionText = isVerify ? 'Verify Email Address' : (isReset ? 'Reset Password' : 'View Invoice');
   
   let mailOptions = {
     from: `"Auth Platform" <${user}>`,
     to: email,
     subject,
     html: `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" 
                 style="background:#ffffff; border-radius:8px; padding:30px;">
            <tr>
              <td>
                <h2 style="color:#111827; margin-bottom:10px;">
                  ${isInvoice ? 'Payment Successful! 🎉' : (isVerify ? 'Welcome to' : 'Password Support for')} <strong>Auth</strong> 🚀
                </h2>
                <p style="color:#374151; font-size:15px;">
                  ${isInvoice 
                    ? 'Thank you for your purchase. Your payment has been successfully processed and your account plan has been updated.' 
                    : (isVerify
                      ? 'Thank you for creating an account with <strong>Auth</strong>. To activate your account and access the dashboard, please verify your email address.'
                      : 'You requested to reset your password. Click the button below to set a new password.')}
                </p>
                <div style="margin: 30px 0; text-align:center;">
                  <a href="${link}"
                     style="background-color:#2563eb; color:#ffffff; padding:14px 26px; text-decoration:none; border-radius:6px; font-weight:600; display:inline-block;">
                    ${actionText}
                  </a>
                </div>
                ${isInvoice ? '<p style="color:#6b7280; font-size:13px; text-align:center;">Click the button above to download your PDF invoice.</p>' : ''}
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0;"/>
                <p style="color:#374151; font-size:14px;"><strong>Email:</strong> ${email}</p>
                <p style="margin-top:40px; color:#374151; font-size:14px;">Regards,<br/><strong>Auth Security Team</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
   };

   try {
     const info = await transporter.sendMail(mailOptions);
     console.log("Mail sent successfully:", info.response);
     return info;
   } catch (error) {
     console.error("Mail Send Error:", error);
     throw error;
   }
}
export default sendMail;
