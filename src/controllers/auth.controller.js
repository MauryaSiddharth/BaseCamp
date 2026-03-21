import {User}  from '../models/user.model.js'
import {ApiResponse} from '../utils/api-response.js'
import {asyncHandler} from "../utils/async-handler.js"
import  {ApiError}   from '../utils/api-error.js'
import { error } from 'node:console'
import   {emailVerificationMailgen, forgotPasswordMailgen, sendEmail} from "../utils/mail.js"
import jwt from 'jsonwebtoken'



const generateAccessAndRefreshTokens=async (userId)=>{
  try {
      const user=await User.findById(userId);
    const accessToken= user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken =refreshToken;
    await user.save({validateBeforeSave:false});
    return { accessToken,refreshToken}
  } 
  catch (error) {
      throw new ApiError(400,"something went wrong while accessToken")
  } 
}


const registerUser= asyncHandler(async(req,res)=>{
         const {email,username,password , role} = req.body;
        const existedUser= await User.findOne({
                $or: [{username},{email}]
            })
         
            if(existedUser){
                throw new ApiError(409,"User with email or username already exist",[ ])
            }

        const user= await  User.create({
                email,
                username,
                password,
                isEmailVerfied:false
            })

         const {hashedToken,unhashedToken ,tokenExpiry} = user.generateTemporaryToken(); 
         
         user.emailVerificationToken = hashedToken;
         user.emailVerificationExpiry= tokenExpiry;

        await user.save({validateBeforeSave:false})

            //    want to pass option in sendEmail function
        await sendEmail({
              email:user?.email,
              subject:" please verify your email",
              mailgenContent:emailVerificationMailgen(
                user.username,
                // `${req.protocol}://${req.get("host")/api/v1/users/verify-email/${unhashedToken} }`
             `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`
            )
        });

       const createdUser= await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )
              
        if(!createdUser){
            throw new ApiError(401,"something went wrong while registering user")
        }

        return res
                .status(201)
                .json(
                    new ApiResponse(
                        200,
                        createdUser,
                        "User registered successfully and verification email has been sent to email"
                    )
                )
})

const login=asyncHandler(async(req,res)=>{
     const {email,password,username} = req.body;
     
     if(!email){
        throw new ApiError(401," Email is required")
     }

   const user= await User.findOne({email})
   if(!user){
    throw new ApiError(400,"user nor found")
   }

   const isPasswordCorrect= await user.isPasswordCorrect(password);
   
   if(!isPasswordCorrect){
       throw new ApiError (400,"Password is incorrect")
   }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
       
  
       const loggedInUser= await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        const options={
            httpOnly:true,
            secure:true
        }
     
        return res
          .status(200)
          .cookie("access-token",accessToken,options)
          .cookie("refresh-token",refreshToken,options)
           .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser,
                    accessToken,
                    refreshToken
                },
                "user logged in successfully"
            )
           )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true
        }
    );
    
    const options={
        httpOnly:true,
        secure:true
    }

    return  res
              .status(200)
              .clearCookie("access-token",options)
               .clearCookie("refresh-token",options)
               .json(
                new ApiResponse(
                    200,
                    {},
                    "user logged out"
                )
               )
   
});


const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
        .status(200)
        .json(
            200,
             req.user,
        "current user fetched successfully"
        )
        
})

const verifyEmail=asyncHandler(async(req,res)=>{
    const {verificationToken}  = req.params;
    if(!verificationToken){
        throw new ApiError(
            400,
            "Email verification token is missing"
        )
    }

    let hashedToken = crypto
                        .createHash("sha256")
                        .update(verificationToken)
                        .digest("hex")


           const user= await User.findOne({
                    emailVerificationToken:hashedToken,
                    emailVerificationExpiry:{$gt: Date.now()}
                 })       

    if(!user){
        throw new ApiError(
            400,
            "Token is invalid"
        )
    }
      user.emailVerificationToken=undefined;
      user.emailVerificationExpiry=undefined;

      user.isEmailVerfied= true;
    await user.save({validateBeforeSave:false})

    return res   
              .status(200)
              .json(
                new ApiResponse(
                    200,
                    {
                        isEmailVerfied:true
                    },
                    "Email is Verified "
                )
              )
})

const resendEmailVerification=asyncHandler(async(req,res)=>{
      const user=  await User.findById(req.user?._id);
      if(!user){
        throw new ApiError(
            404,
            "user does not exists"
        )
      }

      if(user.isEmailVerified){
        throw new ApiError(
            409,
            "email is already verified"
        )
      }

        const {hashedToken,unhashedToken ,tokenExpiry} = user.generateTemporaryToken(); 
         
         user.emailVerificationToken = hashedToken;
         user.emailVerificationExpiry= tokenExpiry;

        await user.save({validateBeforeSave:false})

            //    want to pass option in sendEmail function
        await sendEmail({
              email:user?.email,
              subject:" please verify your email",
              mailgenContent:emailVerificationMailgen(
                user.username,
                // `${req.protocol}://${req.get("host")/api/v1/users/verify-email/${unhashedToken} }`
             `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`
            )
        });

         return res
                 .status(200)
                 .jsoon(
                    new ApiResponse(
                        200,
                        "mail has been sent to email-id"
                    )
                 )


})


const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken ||  req.body.refreshToken ;

    if(!incomingRefreshToken){
        throw new ApiError(
            401,
            "unauthorized access"
        )
    }
    try {
      const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
     const user = await User.findById(decodedToken?._id);

       if(!user){
        throw new ApiError(
            401,
            "Invalid Refresh Token"
        )
    }

    if(incomingRefreshToken!== user?.refreshToken){
        throw new ApiError(
            401,
            "Refresh Token is expired"
        )
    }
     
    const options={
        httpOnly:true,
        secure:true 
       }

    const {accessToken ,newrefreshToken}= await generateAccessAndRefreshTokens(user._id)
     
    user.refreshToken= newrefreshToken;

    await user.save()

    return res
         .status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("newRefreshToken",newRefreshToken,options)
         .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
         )



    } catch (error) {
        throw new ApiError(401,"Invalid Refresh Token")
        
    }
})

const forgotPasswordRequest= asyncHandler(async(req,res)=>{
    const {email} = req.body;
    
  const user= await User.findOne({email})

   if(!user){
      throw new ApiError(
        404,
        "User does not exist",
        []
      )
   }
    
 const {unhashedToken,hashedToken,tokenExpiry}=  user.generateTemporaryToken();

     user.forgotPasswordToken=hashedToken;
     user.forgotPasswordExpiry=tokenExpiry;

     await user.save({validateBeforeSave:false})

     await sendEmail({
        email:user?.email,
              subject:"Password reset request",
              mailgenContent:forgotPasswordMailgen(
                user.username,
               
             `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}`
            )
     })

     return res.status(200).json(
               200,
               {},
               "Password reset mail has been sent to your mail"
     )

})


const  resetForgotPassword=asyncHandler(async(req,res)=>{
    const {resetToken} = req.params
    const {newPassword}= req.body

    let hashToken= crypto
                   .createHash("sha256")
                   .update(resetToken)
                   .digest("hex")

  const user=  await User.findOne({
        forgotPasswordToken:hashToken,
        forgotPasswordExpiry: {$gt :Date.now()}

    })

    if(!user){
        throw new ApiError(
            409,
            "Token is invalid or expired"
        )
    }

    user.forgotPasswordExpiry=undefined
    user.forgotPasswordToken=undefined

    user.password=newPassword

    await user.save({validateBeforeSave:false})

    return res.status(200)
              .json(
                new ApiResponse(
                    200,
                    {},
                    "Password reset successfully"
                )
              )


})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    
    const user = await User.findById(req.user?._id);

   const isPasswordValid= await user.isPasswordCorrect(oldPassword);

     if(!isPasswordValid){
        throw new ApiError(400,"Password is invalid")
     }
     
  user.password= newPassword
   await user.save({validateBeforeSave:false})

   return res.status(200)
             .json(
                new ApiResponse(200,{},"Password changed successfully")
             )

})


export {
    registerUser,
    login ,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword
}

