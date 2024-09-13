import {Router} from "express"
import { 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    changeCurrentPassword, 
    updateAccountDetails, updateUserAvatar, getCurrentUser, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/user.auth.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser

)

router.route('/login').post(loginUser)

// secured routes

router.route('/logout').post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route('/change-password').post(verifyJWT,changeCurrentPassword)

router
.route('/updateAccountDetails')
.patch(verifyJWT, updateAccountDetails)

router.route('/updateUserAvatar').patch(verifyJWT, upload.single("avatar"),     
    // upload.fields([
    // {
    //     name:"avatar",
    //     maxCount:1
    // }]),
     updateUserAvatar
)

router.route('/updateCoverImage').patch(verifyJWT,
    upload.single("coverImage"), updateUserCoverImage
)

router.route('/current-user').post(verifyJWT, getCurrentUser)


router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory)

export default router;