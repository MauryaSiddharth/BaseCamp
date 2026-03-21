import {body} from 'express-validator'

const userRegisterValidator=()=>{
  return [
     body("email")
       .trim()
       .isEmpty()
       .withMessage("Email is required")
        .isEmail()
         .withMessage("Email is invalid"),

     body("username")
         .trim()
         .isEmpty()
         .withMessage("Username is required")
         .isLowercase()
         .withMessage("Username must be in lowercase")
         .isLength({min:3})
         .withMessage("Username must be atleast 3 character long"),

         body("password")
            .trim()
            .isEmpty()
            .withMessage("Password is required"),

          body("fullname")
            .optional()
            .trim()
            
    
  ]
}

const userLoginValidator=()=>{
  return [
    body("email")
    .isEmail()
    .withMessage("Email is invalid"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
     
  ]
}

const userChangeCurrentPasswordValidator=()=>{
  return[
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword").notEmpty().withMessage("New password is required"),

  ]
}

const userForgotPasswordValidator=()=>{
  return [
    body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email is invalid")
  ]
}

const userResetForgotPasswordValidator=()=>{
  return [
    body("newPassword")
    .notEmpty()
    .withMessage("password is required")
  ]
}

export {
    userRegisterValidator,
    userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator
    
    
}