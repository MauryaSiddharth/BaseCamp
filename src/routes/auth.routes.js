import {Router} from  'express'
import  {registerUser,login,logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resendEmailVerification} from   '../controllers/auth.controller.js'  
import { validate } from '../middleware/validator.middleware.js'
import {userRegisterValidator,userLoginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator} from '../validators/index.js'
import {verifyJWT}  from '../middleware/auth.middleware.js'
 
const router= Router()

router.route('/register').post(userRegisterValidator(),validate, registerUser)
router.route('/login').post(userLoginValidator(),validate,login)
router.route('/verify/email/:verificationToken').get(verifyEmail)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/forgot-password').post(userForgotPasswordValidator(),validate, forgotPasswordRequest )
router.route('/reset-password/:resetToken').post(userResetForgotPasswordValidator(),validate,resetForgotPassword)

//secured route
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/current-user').post(verifyJWT,getCurrentUser)
router.route('/change-password').post(verifyJWT,userChangeCurrentPasswordValidator(),validate,changeCurrentPassword)
router.route('/resend-email-verification').post(verifyJWT,resendEmailVerification)




export default router
