import async from "async";
import MSG from "../../../config/message";
import UserSchema from "../../../db/models/User";
const config = rootRequire("config");
const ED = rootRequire("utils/encry_decry");
const mongoose = require("mongoose");
const Uploader = rootRequire("support/uploader");

module.exports = {
 
   /**
   * This function is used for user Signup
   * @param {firstName}
   * @param {lastName}
   * @param {email}
   * @param {userType}
   *
   */

  /**
   * this api used for add user
   */
  userSignup: (req, res) => {
    async.waterfall(
      [
        (nextCall) => {
          req.checkBody("firstName", MSG.FNAME_REQ).notEmpty();
          req.checkBody("lastName", MSG.LNAME_REQ).notEmpty();
          req.checkBody("email", MSG.EMAIL_REQ).notEmpty();
          req.checkBody("phoneNo", MSG.PH_NUM_REQ).notEmpty();
          req.checkBody("userType", MSG.USER_TYPE).notEmpty();
          req.checkBody("password", MSG.PASSWORD_REQ).notEmpty();
          const error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          } else {
            nextCall(null, req.body);
          }
        },
        (body, nextCall) => {
          UserSchema.findOne({
            phoneNo: body.phoneNo,
            isDeleted:false
          }).exec((err, result) => {
            if (err) {
              return nextCall({ message: MSG.SOMETHING_WRONG });
            } else if (result) {
                return nextCall({ message: MSG.PHONE_EXISTS });
            } else {
              nextCall(null, body);
            }
          });
        },
        (body, nextCall) => {
          UserSchema.findOne({
            email: body.email.toLowerCase(),
            isDeleted:false
          }).exec((err, result) => {
            if (err) {
              return nextCall({ message: MSG.SOMETHING_WRONG });
            } else if (result) {
                return nextCall({ message: MSG.EMAIL_EXISTS });
            } else {
              nextCall(null, body);
            }
          });
        },
        (body, nextCall) => {
          let insertObj = {
            ...body,
            email: body.email.toLowerCase(),
            password: ED.encrypt(body.password),
            userType: body.userType,
          };
          const userSchema = new UserSchema(insertObj);
          userSchema.save((err, user) => {
            if (err) {
              return nextCall({ message: MSG.SOMETHING_WRONG });
            } else {
              const { password, ...rest } = JSON.parse(JSON.stringify(user));
              nextCall(
                null,
                body,
                {
                  ...rest,
                },
                password
              );
            }
          });
        },
      ],
      (err, response) => {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: err.message || MSG.SOMETHING_WRONG,
            data: {},
          });
        } else {
          return res.status(200).sendToEncode({
            status: 200,
            message: MSG.USER_SIGNUP,
            data: response,
          });
        }
      }
    );
  },

  /**
   * this api used for find All user
   */
  viewAllUser: (req, res) => {  
    console.log("1")
    async.waterfall(
      [
        async ( nextCall) => {
          let sort = {
            [req.body.column || "createdAt"]: req.body.order == "asc" ? 1 : -1,
          };
          const page = req.body.page ? req.body.page : 1;
          const limit = req.body.limit ? req.body.limit : 10;
          const skip = (page - 1) * limit;
          let aggregateQuery = [];
          aggregateQuery.push({
            $addFields: {
                  fullName: { $concat: ["$firstName", " ", "$lastName"] },
                }
          })
          if (req.body.search && req.body.search != "") {
            const regex = new RegExp(req.body.search, "i");
            aggregateQuery.push({
              $match: {
                $or: [
                  {
                    firstName: {
                      $regex: regex,
                    },
                  },
                  {
                    lastName: {
                      $regex: regex,
                    },
                  },
                  {
                    fullName: {
                      $regex: regex,
                    },
                  },                  
                ],
              },
            });
          }
          aggregateQuery.push({
            $sort: sort,
          });

          aggregateQuery.push({
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
              list: {
                $push: {
                  _id: "$_id",
                  firstName: "$firstName",
                  image:"$image",
                  lastName: "$lastName",
                  email: "$email",
                  userType: "$userType",
                  isActive: "$isActive",
                  isDeleted: "$isDeleted",
                },
              },
            },
          });
          aggregateQuery.push({
            $unwind: {
              path: "$list",
              preserveNullAndEmptyArrays: true, // optional
            },
          });
          aggregateQuery.push ({
            $skip: parseInt (skip),
          });
          aggregateQuery.push ({
            $limit: parseInt (limit),
          });

          aggregateQuery.push({
            $group: {
              _id: null,
              recordsTotal: { $first: "$count" },
              recordsFiltered: { $first: "$count" },
              data: { $push: "$list" },
            },
          });
          aggregateQuery.push({
            $project: {
              _id: 0,
              recordsTotal: 1,
              recordsFiltered: 1,
              data: 1,
            },
          });
          nextCall(null, aggregateQuery);
        },
        async (aggregateQuery, nextCall) => {
          console.log("2")
          UserSchema.aggregate(aggregateQuery).exec(async (err, finalRes) => {
            if (err) {
              return nextCall({
                message: MSG.SOMETHING_WRONG,
              });
            }
            if (finalRes && finalRes.length == 0) {
              console.log("3")
              finalRes = [
                {
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                },
              ];
            } else {
              console.log("4")
              finalRes = [
                {
                  recordsTotal: finalRes[0].recordsTotal,
                  recordsFiltered: finalRes[0].data.length,
                  data: finalRes[0].data,
                },
              ];
            }
            nextCall(null, finalRes && finalRes[0]);
          });
        },
      ],
      (err, response) => {
        if (err) {
          console.log("err",err)
          return res.status(400).sendToEncode({
            status: 400,
            message: err.message || MSG.SOMETHING_WRONG,
            data: {},
          });
        }
        return res.status(200).sendToEncode({
          status: 200,
          message: MSG.USER_DETAILS,
          data: response,
        });
      }
    );
  },

  /**
   * this api used for find one user
   */
  findUser: (req, res) => {
    async.waterfall(
      [
        /** these function is used for check req parameter */
        (nextCall) => {
          req
            .checkBody("userId", MSG.USER_ID)
            .notEmpty();
          const error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          } else {
            nextCall(null, req.body);
          }
        },
        /** these function is used for vendor team member is exists or not in db */
        (body, nextCall) => {
          UserSchema.findOne({
            _id: body.userId,
            isDeleted: false,
          }).exec((err, member) => {
            if (err) {
              return nextCall({ message: MSG.SOMETHING_WRONG });
            } else if (!member) {
              return nextCall({ message: MSG.USER_NOT_FOUND });
            } else {
              const { password, ...rest } = JSON.parse(
                JSON.stringify(member)
              );
              nextCall(null, { ...rest });
            }
          });
        },
      ],
      (err, response) => {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: err.message || MSG.SOMETHING_WRONG,
            data: {},
          });
        } else {
          return res.status(200).sendToEncode({
            status: 200,
            message: MSG.USER_DETAILS,
            data: response,
          });
        }
      }
    );
  },
    /**
   * this api used for edit user
   */
 
  editUser:(req,res) =>{
    async.waterfall(
      [
        (nextCall) => {
          req
            .checkBody("userId", MSG.USER_ID)
            .notEmpty();
          const error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          } else {
            nextCall(null, req.body);
          }
        },
        async (body, nextCall) => {
            try {
            let member = await UserSchema.findOne({
              _id: new mongoose.Types.ObjectId(body.userId),
              isDeleted: false,
            });
              if (!member) {
                return nextCall({ message: MSG.VENDORTEAMMEMBER_NOT_FND });
              }
            let editObj = {};
            if (body.firstName) {
              editObj.firstName = body.firstName;
            }
            if (body.lastName) {
              editObj.lastName = body.lastName;
            }
            if (body.phoneNo) {
              editObj.phoneNo = body.phoneNo;
            }
            if (body.email) {
              editObj.email = body.email;
            }
            if (body.userType) {
              editObj.userType = body.userType;
            }
            if (body.isActive != null) {
              editObj.isActive = body.isActive;
            }
            await UserSchema.findOneAndUpdate(
              { _id: member._id },
              editObj,
              { new: true }
            );
            nextCall(null, null);
          } catch (error) {
            return nextCall({ message: MSG.SOMETHING_WRONG });
          }
        },
      ],
      (err, response) => {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: err.message || MSG.SOMETHING_WRONG,
            data: {},
          });
        } else {
          return res.status(200).sendToEncode({
            status: 200,
            message: MSG.USER_UPDATED,
            data: {},
          });
        }
      }
    );
  },

  /**
   * this api used for delete user
   */

  deleteUser: (req, res) => {
    async.waterfall(
      [
        (nextCall) => {
          req
            .checkBody("userId", MSG.USER_ID)
            .notEmpty();
          const error = req.validationErrors();
          if (error && error.length) {
            return nextCall({
              message: error[0].msg,
            });
          } else {
            nextCall(null, req.body);
          }
        },
        async (body, nextCall) => {
          try {
            let user = await UserSchema.findOne({
              _id: body.userId,
            });
            if (!user) {
              return nextCall({ message: MSG.USER_NOT_FOUND });
            }
            const deleteObj ={
              isDeleted: true,
              isActive: false
            }
            UserSchema.findOneAndUpdate(
              { _id: body.userId },
              deleteObj,
              { new: true }
            ).exec((err, member) => {
              if (err) {
                return nextCall({ message: MSG.SOMETHING_WRONG });
              } else {
                nextCall(null, member);
              }
            });
          } catch (error) {
            return nextCall({ message: MSG.SOMETHING_WRONG });
          }
        },
      ],
      (err, response) => {
        if (err) {
          return res.status(400).sendToEncode({
            status: 400,
            message: err.message || MSG.SOMETHING_WRONG,
            data: {},
          });
        } else {
          return res.status(200).sendToEncode({
            status: 200,
            message: MSG.USER_DELETED,
            data: {},
          });
        }
      }
    );
  },

};
