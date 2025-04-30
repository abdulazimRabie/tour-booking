import { createTransport } from "nodemailer"

const sendEmail = async options => {
    // 1. create transport
    const transport = createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    // 2. Defie email options
    const mailOptions = {
        from: "Abdelazim Rabie <azim.rabiee@gmail.com>",
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    // 3. send email
    await transport.sendMail(mailOptions)
}

export default sendEmail