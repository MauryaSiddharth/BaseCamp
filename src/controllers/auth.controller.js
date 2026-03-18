import {User}  from '../models/user.model.js'
import {ApiResponse} from '../utils/api-response.js'
import {asyncHandler} from "../utils/async-handler.js"
import  {ApiError}   from '../utils/api-error.js'
import { error } from 'node:console'
import   {emailVerificationMailgen, sendEmail} from "../utils/mail.js"


const generateAccessAndRefreshTokens=async (userId)=>{
  try {
      const user=await User.findById(userId);
    const accessToken= user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken =refreshToken;
    await user.save({validateBeforeSave:false});
    return { accessToken,refreshToken}
  } catch (error) {
      throw new ApiError(500,"something went wrong while accessToken")
  } 
}




const registerUser= asyncHandler(async(req,res)=>{
         const {email,username,password , role} = req.body;
        const existedUser= User.findOne({
                $or: [{username},{email}]
            })
         
            if(existedUser){
                throw new ApiError(409,"User with email or username already exist",[])
            }

        const user= User.create({
                email,
                username,
                password,
                isEmailVerfied:false
            })

         const {hashedToken,unhashedToken ,tokenExpiry} = user.generateTemporaryToken; 
         
         user.emailVerificationToken = hashedToken;
         user.emailVerificationExpiry= unhashedToken;

        await user.save({validationBeforeSave:false})

            //    want to pass option in sendEmail function
        await sendEmail({
              email:user?.email,
              subject:" please verify your email",
              mailgenContent:emailVerificationMailgen(
                user.username,
                `${req.protocol}://${req.get("host")/api/v1/users/verify-email/${unhashedToken} }`
              )
        });
})
