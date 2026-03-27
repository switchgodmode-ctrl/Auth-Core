import nodemailer from 'nodemailer';

function sendMail(email, link, type = "verify") {
   if (!email) return; 
   const user = process.env.MAIL_USER || process.env.user || process.env.EMAIL_USER || "";
   const pass = process.env.MAIL_PASS || process.env.pass || process.env.EMAIL_PASS || "";
   if (!user || !pass) return;
   const host = process.env.MAIL_HOST || process.env.host || "";
   const port = process.env.MAIL_PORT || process.env.port || "";
   const secure = process.env.MAIL_SECURE || process.env.secure || "";
   const service = process.env.MAIL_SERVICE || process.env.service || "gmail";
   let transporter = host ? nodemailer.createTransport({
     host,
     port: Number(port || 465),
     secure: secure ? secure === "true" : true,
     auth: { user, pass }
   }) : (service && service.toLowerCase() === "gmail"
     ? nodemailer.createTransport({
         host: "smtp.gmail.com",
         port: 465,
         secure: true,
         auth: { user, pass }
       })
     : nodemailer.createTransport({
         service,
         auth: { user, pass }
       })
   );
   transporter.verify().then(() => {
     console.log("SMTP ready:", service || host, "as", user);
   }).catch(err => {
     console.log("SMTP verify failed:", err?.message || err);
   });

  const isVerify = type === "verify";
  const subject = isVerify ? 'Verify Your Auth Account' : 'Reset Your Auth Password';
  const actionText = isVerify ? 'Verify Email Address' : 'Reset Password';
  let mailOptions = {
     from: user,
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
                  ${isVerify ? 'Welcome to' : 'Password Support for'} <strong>Auth</strong> 🚀
                </h2>

                <p style="color:#374151; font-size:15px;">
                  ${isVerify
                    ? 'Thank you for creating an account with <strong>Auth</strong>. To activate your account and access the dashboard, please verify your email address.'
                    : 'You requested to reset your password. Click the button below to set a new password. If you did not request this, you can ignore this email.'}
                </p>

                <div style="margin: 30px 0; text-align:center;">
                  <a href="${link}"
                     style="
                       background-color:#2563eb;
                       color:#ffffff;
                       padding:14px 26px;
                       text-decoration:none;
                       border-radius:6px;
                       font-weight:600;
                       display:inline-block;
                     ">
                    ${actionText}
                  </a>
                </div>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0;"/>

                <h3 style="color:#111827;">Account</h3>
                <p style="color:#374151; font-size:14px;">
                  <strong>Email:</strong> ${email}
                </p>

                <p style="color:#6b7280; font-size:13px;">
                  ${isVerify
                    ? 'If you did not register for an Auth account, you can safely ignore this email.'
                    : 'If you did not request a password reset, you can safely ignore this email.'}
                </p>

                <p style="margin-top:40px; color:#374151; font-size:14px;">
                  Regards,<br/>
                  <strong>Auth Security Team</strong>
                </p>

                <p style="font-size:12px; color:#9ca3af;">
                  This is an automated message. Please do not reply.
                </p>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

   };

   transporter.sendMail(mailOptions, function(error, info){
     if (error) {
       console.log(error);
     } else {
       console.log(info.response);
     }
   });
}
export default sendMail;
