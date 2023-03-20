import async from 'async';
import MSG from '../../../config/message';
import OrderSchema from '../../../db/models/Order'
const mongoose = require('mongoose');
const Uploader = rootRequire("support/uploader");
import DS from "../../../services/date";
const path = require("path");

module.exports = {

    createOrder: (req, res) => {
        async.waterfall(
          [
            (nextCall) => {
              req.checkBody("user_id", MSG.USER_ID).notEmpty();
              req.checkBody("productId", MSG.PRODUCT_ID_REQUIRED).notEmpty();
              req.checkBody("required_date", MSG.REQUIRED_DATE).notEmpty();
              req.checkBody("order_code", MSG.ORDER_CODE_REQ).notEmpty();
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
              let insertObj = {
                ...body,
                status:'pending'
              };
              const orderSchema = new OrderSchema(insertObj);
              orderSchema.save((err, order) => {
                if (err) {
                    console.log(err)
                  return nextCall({ message: MSG.SOMETHING_WRONG });
                } else {
                  nextCall(
                    null,
                    body,
                    order
                  );
                }
              });
            },
          ],
          (err, response) => {
            if (err) {
                console.log('',err)
              return res.status(400).sendToEncode({
                status: 400,
                message: err.message || MSG.SOMETHING_WRONG,
                data: {},
              });
            } else {
              return res.status(200).sendToEncode({
                status: 200,
                message: MSG.ORDER_ADDED,
                data: response,
              });
            }
          }
        );
      },

    listOrder: (req,res) => {
      async.waterfall([
        nextCall => {
            let sort = {
                [req.body.column || 'createdAt']: req.body.order == 'asc' ? 1 : -1
            }
            nextCall(null, sort)
        },
        (sort, nextCall) => {
            const page = req.body.page ? req.body.page : 1;
            const limit = req.body.limit ? req.body.limit : 10;
            const skip = (page - 1) * limit;
            let aggregateQuery = []

            aggregateQuery.push({
                $lookup: {
                  from: "tbl_user",
                  localField: "user_id",
                  foreignField: "_id",
                  as: "user",
                },
              });
              aggregateQuery.push({
                $unwind: {
                  path: "$user",
                  preserveNullAndEmptyArrays: true, // optional
                },
              });
              aggregateQuery.push({
                $lookup: {
                  from: "tbl_product",
                  localField: "userId",
                  foreignField: "_id",
                  as: "product",
                },
              });
              aggregateQuery.push({
                $unwind: {
                  path: "$product",
                  preserveNullAndEmptyArrays: true, // optional
                },
              });
            aggregateQuery.push({
              $sort: sort
            })
      
            aggregateQuery.push({
                $group: {
                    _id: null,
                    count: {
                        $sum: 1
                    },
                    list: {
                        $push: {
                            _id: "$_id",
                            firstName:"$user.firstName",
                            lastName:"$user.lastName",
                            email:"$user.email",
                            productName:"$product.name",
                            productPrice:"$product.price",
                            required_date: '$required_date',
                            status: "$status",
                            shipped_date: "$shipped_date",
                            isActive: "$isActive",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                        }
                    }
                }
            })
            aggregateQuery.push({
                $unwind: {
                    path: "$list",
                    preserveNullAndEmptyArrays: true // optional
                }
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
                    recordsTotal: { "$first": "$count" },
                    recordsFiltered: { "$first": "$count" },
                    data: { "$push": "$list" }
                }
            });
            aggregateQuery.push({
                $project: {
                    _id: 0,
                    recordsTotal: 1,
                    recordsFiltered: 1,
                    data: 1
                }
            });
            nextCall(null, aggregateQuery)
        },
        async (aggregateQuery, nextCall) => {
            OrderSchema.aggregate(aggregateQuery)
                .exec(async (err, finalRes) => {
                    if (err) {
                        return nextCall({
                            message: MSG.SOMETHING_WRONG
                        })
                    }
                    if (finalRes && finalRes.length == 0) {
                        finalRes = [{
                            "recordsTotal": 0,
                            "recordsFiltered": 0,
                            "data": []
                        }];
                    }
                    else {
                            finalRes = [{
                            "recordsTotal": finalRes[0].recordsTotal,
                            "recordsFiltered": finalRes[0].data.length,
                            "data": finalRes[0].data,
                        }];
                    }
                    nextCall(null, finalRes && finalRes[0]);
                })
        }
    ], (err, response) => {
        if (err) {
            return res.status(400).sendToEncode({
                status: 400,
                message: err.message || MSG.SOMETHING_WRONG,
                data: {}
            });
        }
        return res.status(200).sendToEncode({
            status: 200,
            message: MSG.ORDER_FETCHED,
            data: response
        });
      });
    },

    viewOrder: (req,res) => {
      async.waterfall([
        ( nextCall) => {
          let aggregateQuery = []
            aggregateQuery.push({
                $match: {
                    isDeleted:false,
                    _id:mongoose.Types.ObjectId(req.body.orderId)
                }
            })
            
            aggregateQuery.push({
                $lookup: {
                  from: "tbl_user",
                  localField: "user_id",
                  foreignField: "_id",
                  as: "user",
                },
              });
              aggregateQuery.push({
                $unwind: {
                  path: "$user",
                  preserveNullAndEmptyArrays: true, // optional
                },
              });
              aggregateQuery.push({
                $lookup: {
                  from: "tbl_product",
                  localField: "userId",
                  foreignField: "_id",
                  as: "product",
                },
              });
              aggregateQuery.push({
                $unwind: {
                  path: "$product",
                  preserveNullAndEmptyArrays: true, // optional
                },
              });
            aggregateQuery.push({
              $project:{
                _id: "$_id",
                firstName: '$firstName',
                lastName: "$lastName",
                email:"$email",
                productName:"$productName",
                productPrice:"$productPrice",
                required_date:"$required_date",
                status: "$status",
                order_date: "$order_date",
                shipped_date:"$shipped_date",
                isActive: "$isActive",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
              }
            })
            nextCall(null, aggregateQuery)
        },
        async (aggregateQuery, nextCall) => {
            OrderSchema.aggregate(aggregateQuery)
                .exec(async (err, product) => {
                    if (err) {
                        console.log(err)
                        return nextCall({
                            message: MSG.SOMETHING_WRONG
                        })
                    }
                    nextCall(null, product && product[0]);
                })
        }
    ], (err, response) => {
        if (err) {
            return res.status(400).sendToEncode({
                status: 400,
                message: err.message || MSG.SOMETHING_WRONG,
                data: {}
            });
        }
        return res.status(200).sendToEncode({
            status: 200,
            message: MSG.PRODUCT_FETCHED,
            data: response
        });
      });

    },

    editOrder:(req,res) =>{
        async.waterfall(
          [
            (nextCall) => {
              req
                .checkBody("orderId", MSG.ORDER_ID_REQ)
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
                let member = await OrderSchema.findOne({
                  _id: new mongoose.Types.ObjectId(body.orderId),
                  isDeleted: false,
                });
                  if (!member) {
                    return nextCall({ message: MSG.ORDER_NOT_FND });
                  }
                let editObj = {};
                if (body.user_id) {
                  editObj.user_id = body.user_id;
                }
                if (body.productId) {
                  editObj.productId = body.productId;
                }
                if (body.required_date) {
                  editObj.required_date = body.required_date;
                }
                if (body.order_code) {
                  editObj.order_code = body.order_code;
                }
                if (body.isActive != null) {
                  editObj.isActive = body.isActive;
                }
                await OrderSchema.findOneAndUpdate(
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
                message: MSG.ORDE,
                data: {},
              });
            }
          }
        );
      },

    changeOrderStatus: (req,res) => {
      async.waterfall(
          [
          /** these function is used for check req parameter */
          (nextCall) => {
              req.checkBody ('orderId', MSG.ORDER_ID_REQ).notEmpty ();
              req.checkBody ('status', MSG.STATUS_REQ).notEmpty ();
              const error = req.validationErrors ();
              if (error && error.length) {
              return nextCall ({
                  message: error[0].msg,
              });
              } else {
              nextCall (null,req.body);
              }
          },
          /** these function is used for restaurant is exists or not in db */
          async (body,nextCall) => {
              try {
                  let order = await OrderSchema.findOne({_id:body.orderId,isDeleted:false}) 
                  if(!order) {
                      return nextCall({message:MSG.ORDER_NOT_FND})
                  }
                  const updateObj={
                    status:body.status
                  }
                  await OrderSchema.findOneAndUpdate(
                      {_id:order._id},
                      updateObj,
                      {new:true}
                      )
                  nextCall(null,null)                        
              } catch (error) {
                  return nextCall({message:MSG.SOMETHING_WRONG})
              }
          },
          ],
          (err, response) => {
          if (err) {
              return res.status (400).sendToEncode ({
                  status: 400,
                  message: err.message || MSG.SOMETHING_WRONG,
                  data: {},
              });
          } else {
              return res.status (200).sendToEncode ({
                  status: 200,
                  message: MSG.ORDER_UPDATE,
                  data: {},
              });
          }
          }
      )
    },
  
    deleteOrder: (req,res) => {
      async.waterfall([
          (nextCall) => {
              req.checkBody('orderId',MSG.ORDER_ID_REQ).notEmpty()
              const error = req.validationErrors ();
              if (error && error.length) {
                  return nextCall ({
                      message: error[0].msg,
                  });
              } else {
                  nextCall (null,req.body);
              }
          },
          async (body,nextCall) => {
              try {
                 const order = await OrderSchema.findOne({_id:body.productId})
                  if(!order) {
                      return nextCall({message: MSG.ORDER_NOT_FND})
                  }
                  OrderSchema.findOneAndUpdate(
                      {_id:body.orderId},
                      { isDeleted:true },
                      {new:true})
                  .exec(async (err, order) => {
                    if (err) {
                      return nextCall({ message: MSG.SOMETHING_WRONG });
                    } else {
                      nextCall(null, order);
                    }
                  });            
                      
              } catch (error) {
                  return nextCall({message:MSG.SOMETHING_WRONG})
              }
          }
      ],
      (err,response) => {
          if(err) {
              return res.status(400).sendToEncode( {
                  status:400,
                  message: err.message || MSG.SOMETHING_WRONG,
                  data:{}
              })
          } else {
              return res.status(200).sendToEncode({
                  status:200,
                  message:MSG.ORDER_DELETED,
                  data:{}
              })
          }
      })

    },

}