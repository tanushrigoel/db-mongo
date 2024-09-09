import {Router} from "express"
import { loginUser, logoutUser, refreshAccessToken, registerUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar } from "../controllers/user.controller.js";
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

router.route('/updateAccountDetails').post(verifyJWT, updateAccountDetails)

router.route('/updateUserAvatar').post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    }]),
    verifyJWT, updateUserAvatar
)

export default router;