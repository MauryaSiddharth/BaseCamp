import Mailgen from 'mailgen';
import nodemailer from 'nodemailer'

const sendEmail=async(options)=>{
  const mailGenerator=  new Mailgen({
         theme:"default",
         product:{
            name:"task manager",
            link:"https://taskmanagelink.com"
         }
    })

   const emailTextual= mailGenerator.generatePlaintext(options.mailgenContent)

   const emailHtml= mailGenerator.generate(options.mailgenContent)

  const transporter= nodemailer.createTransport({
    host:process.env.MAILTRAP_SMTP_HOST,
    port:process.env.MAILTRAP_SMTP_PORT,
    auth:{
        user:process.env.MAILTRAP_SMTP_USER,
        pass:process.env.MAILTRAP_SMTP_PASS
    }
   })
      
   const mail={
    from:'mail.taskmanager@team.com',
    to:options.email,
    subject:options.subject,
    text:emailTextual,
    html:emailHtml
   }

   try {
    await transporter.sendMail(mail) 
   } catch (error) {
         console.error("Email service failed, make sure that your credential of mailtrap is correct in .env file")
     
         console.error("Error :" , error)
   }

}


const emailVerificationMailgen = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our platform! We are excited to have you onboard.",
            action: {
                instructions: "To verify your email, please click the following button:",
                button: {
                    color: '#22BC66',
                    text: 'Verify your email',
                    link: verificationUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we would help you!"
        }
    };
};

const forgotPasswordMailgen = (username,passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got request to reset the password of your account",
            action: {
                instructions: "To reset the password click the following button",
                button: {
                    color: '#e9230d',
                    text: 'Reset password',
                    link: passwordResetUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we would help you!"
        }
    };
};


export {
    forgotPasswordMailgen,
    emailVerificationMailgen,
    sendEmail
}