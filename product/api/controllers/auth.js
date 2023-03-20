import jwt from 'jsonwebtoken'
import async from 'async'
import MSG from '../../config/message'
const config = rootRequire('config')
const ED = rootRequire('utils/encry_decry')
import UserSchema from '../../db/models/User'

module.exports = {
  /**
 *  LogIn Api
 * @param phoneNo
 * @param password
  *
  */
  login: (req, res) => {
    async.waterfall(
      [
        nextCall => {
          req.checkBody("phoneNo", MSG.PHONE_REQ).notEmpty();
          req.checkBody("password", MSG.PASSWORD_REQ).notEmpty();

          const error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg
            });
          }
          nextCall(null, req.body);
        },
        async (body, nextCall) => {
          const checkData = {
            phoneNo: body.phoneNo,
            isDeleted:false
          };
          await UserSchema.findOne(checkData, (error, user) => {
            if (error) {              
              nextCall({ message: MSG.SOMETHING_WRONG });
            } else if (!user || user == "undefined") {
              nextCall({
                message: MSG.USER_NOT_FOUND
              });
            } else if(!user.isActive) { 
                nextCall({
                    message: MSG.INACTIVE_USER
                    });    
            } else if (user && user.password != ED.encrypt(body.password)) {
              nextCall({ message: MSG.INV_PASS });
            }else{
              nextCall(null,user)
            }
          });
        },
        async (user, nextCall) => {
          const jwtData = {
            id: user._id,
            email: user.email ? user.email : "",
            userType: user.userType,
          };

          user.accessToken = jwt.sign(jwtData, config.secret, {
            expiresIn: 60 * 60 * 24 // expires in 24 hours
          });
          nextCall(null, JSON.parse(JSON.stringify(user)));
        },
        async (user, nextCall) => {
          const jwtData = {
            accessToken:user.accessToken
          };
          await UserSchema.findOneAndUpdate({_id:user._id},jwtData,{new:true})
          nextCall(null, JSON.parse(JSON.stringify(user)));
        },
      ],
      function (error, response) {
        if (error) {
          return res.status(400).sendToEncode({
            status: 400,
            message: error.message || MSG.SOMETHING_WRONG,
            data: {}
          });
        }
        return res.status(200).sendToEncode({
          status: 200,
          message: MSG.LOGIN_SUCC,
          data: response
        });
      }
    );
  },

    /** these function used for testing api*/
  test: (req, res) => {
        res.sendToEncode({
          status: 1,
          message: 'TEST MESSAGE',
          data: {
            message: 'test',
          },
        });
  },
    
}
