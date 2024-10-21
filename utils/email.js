const nodemailer = require('nodemailer')


const sendMail = async options=>{

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })
    //2-define email options
    const mailOptions = {
        from : "<bolbol@google.com>",
        to : options.email,
        subject : options.subject,
        text : options.message
    }
    console.log(mailOptions)
    //3-send the email
    await transporter.sendMail(mailOptions)
}


module.exports = sendMail