import config from '../../config'
import MSG from '../../config/message'
import UserSchema from '../../db/models/User'
module.exports = (req, res, next) => {
  if (!config.jwtTokenVerificationEnable) {
    return next()
  } else {
    let token = req.headers.authorization
  console.log("req.user:",req.user,req.headers.authorization)
    if (!req.user || (req.user && !req.user.id)) {
      return res.status(401).json({
        status: 400,
        message: MSG.UNAUTH_ORG
      })
    }
        UserSchema.findOne({ _id: req.user.id , userType: req.user.userType }).exec((err, user) => {
          if (err) {
            return res.status(500).json({ status: 0, message: "Server error." + err }); // send server error
          }
          if (!user) {
            return res.status(401).json({ status: 401, message: 'Unauthorized user' })
          }
          console.log('sdfdgsdhhdfjdgjfg',user)
          user = JSON.parse(JSON.stringify(user));

          if (user.isActive == false) {
            /** check if user is block then cannot access api route  */
            return res.status(401).json({
              status: 401,
              message: MSG.INACTIVE_USER,
              data: {}
            })
          }

          if (user.isDeleted == true) {
            /** check if user is block then cannot access api route  */
            return res.status(401).json({
              status: 401,
              message: MSG.USER_NOT_FOUND,
              data: {}
            })
          }

          // if (user.isSubscribed == false) {
          //   /** check if user is block then cannot access api route  */
          //   return res.status(403).json({
          //     status: 403,
          //     hasActiveSubscription:false,
          //     message: MSG.ISSUBSCRIPTION_ORG,
          //     data: {}
          //   })
          // }
          req.user = user;
          console.log("viewAllUser:",req.user)
          return next()
})
  }
}
