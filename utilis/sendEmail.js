import nodemailer from 'nodemailer';

const sendEmail = async function (email, subject, message) {

    // console.log(process.env.SMTP_USERNAME);  // Corrected
    // console.log(process.env.SMTP_PASSWORD);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USERNAME,  // Corrected
            pass: process.env.SMTP_PASSWORD
        }
    });

    await transporter.sendMail({
        from: '"UCS CAB Project" <ucscabproject@gmail.com>',
        to: email,
        subject: subject,
        html: message,
    });

    console.log("Email sent:", message);
}

export default sendEmail;
