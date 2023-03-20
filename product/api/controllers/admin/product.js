import async from 'async';
import MSG from '../../../config/message';
import ProductSchema from '../../../db/models/Product'
const mongoose = require('mongoose');
const Uploader = rootRequire("support/uploader");
import DS from "../../../services/date";
const path = require("path");
import XLSX from "xlsx";
import fs from "fs";

module.exports = {

    createProduct: (req,res) => {
        async.waterfall([
          nextCall => {
            Uploader.getFormFields(req, nextCall);
          },
          (fields, files, nextCall) => {
            if (!fields.hasOwnProperty('name')) {
              return nextCall({message:MSG.NAME_REQ})
            }
            if (!fields.hasOwnProperty('size')) {
              return nextCall({message:MSG.SIZE_IS_REQ})
            }
            if (!files.hasOwnProperty('images')) {
              return nextCall({message:MSG.IMAGE_IS_REQ})
            }
            if(!fields.hasOwnProperty('color')) {
              return nextCall({message: MSG.COLOR_REQ})
            }
            if(!fields.hasOwnProperty('price')) {
              return nextCall({message: MSG.PRICE_REQ})
            }
            if(!fields.hasOwnProperty('quantity')) {
              return nextCall({message: MSG.QUESTION_REQ})
            }
            else {
              nextCall(null, fields, files)
            }
          },
          (fields,files,nextCall) => {
            if (files.images) {
              let images = Array.isArray(files.images)
                ? files.images
                : [files.images];
              async.mapSeries(
                Object.keys(images),
                (k, nextFile) => {
                  if (
                    !images[k] &&
                    images[k].type.indexOf("image") === -1
                  ) {
                    nextCall(null, nextFile);
                  } else {
                    let extension = path.extname(images[k].name);
                    let imageName = DS.getTime() + extension;
                    let image = imageName;
                    async.series(
                      [
                        (nextProc) => {
                          Uploader.uploadFile(
                            {
                              src: images[k].path,
                              dst: path.join(
                                rootPath,
                                "/uploads/product/" + image
                              ),
                            },
                            nextProc
                          );
                        },
                      ],
                      (err) => {
                        nextFile(null, image);
                      }
                    );
                  }
                },
                (loopErr, loopSucc) => {
                  fields.images = loopSucc;
                  nextCall(null, fields);
                }
              );
            } else {
              nextCall(null, fields);
            }
          },
          async (fields,nextCall) => {
            try {
              let insertObj = {
                ...fields
              }
              let product = await ProductSchema.create(insertObj)
              nextCall(null, product)
            } catch (error) {
              return nextCall({message:MSG.SOMETHING_WRONG})
            }
          }
        ],
        (err,response) => {
          if(err) {
            return res.status(400).sendToEncode({
              status:400,
              message:err.message ||MSG.SOMETHING_WRONG,
              data:{}
            })
          } else {
            return res.status(200).sendToEncode({
              status:200,
              message:MSG.PRODUCT_CREATE,
              data:response
            })
          }
        })

    },

    listProduct: (req,res) => {
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
            const filterType = req.body.type;
            if (req.body.search && req.body.search != "") {
                const regex = new RegExp(req.body.search, "i");
                aggregateQuery.push({
                  $match: {
                    $or: [
                      {
                        name: {
                          $regex: regex,
                        },
                      },
                      {
                        productId: {
                          $regex: regex,
                        },
                      },
                    ],
                  },
                });
              }
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
                            name: '$name',
                            price: "$price",
                            image: "$image",
                            quantity:"$quantity",
                            color:"$color",
                            images:"$images",
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
            ProductSchema.aggregate(aggregateQuery)
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
            message: MSG.PRODUCT_FETCHED,
            data: response
        });
      });
    },

    viewProduct: (req,res) => {
      async.waterfall([
        ( nextCall) => {
          let aggregateQuery = []
            aggregateQuery.push({
                $match: {
                    isDeleted:false,
                    _id:mongoose.Types.ObjectId(req.body.productId)
                }
            })
            aggregateQuery.push({
              $group: {
                _id: '$_id',
                price:{$first:"$price"},
                name:{$first:"$name"},
                image:{$first:"$image"},
                quantity:{$first:"$quantity"},
                color:{$first:"$color"},
                images:{$first:"$images"},
                createdAt:{$first:"$createdAt"},
                updatedAt:{$first:"$updatedAt"},
                isActive:{$first:"$isActive"},
              },
            });
            aggregateQuery.push({
              $project:{
                _id: "$_id",
                name: '$name',
                price: "$price",
                productId: "$productId",
                images: "$images",
                quantity:"$quantity",
                color:"$color",
                isActive: "$isActive",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
              }
            })
            nextCall(null, aggregateQuery)
        },
        async (aggregateQuery, nextCall) => {
            ProductSchema.aggregate(aggregateQuery)
                .exec(async (err, product) => {
                    if (err) {
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

    editProduct: (req,res) => {
      async.waterfall([
        nextCall => {
          Uploader.getFormFields(req, nextCall);
        },
        (fields,files,nextCall) => {
          ProductSchema.findOne ({_id: fields.productId,isDeleted:false}).exec ((err, product) => {
            if (err) {
              return nextCall ({message: MSG.SOMETHING_WRONG});
            } else {
              nextCall (null, fields, files,product);
            }
          });
        },
      (fields,files,product,nextCall) => {
        if (files.images) {
          let images = Array.isArray(files.images)
            ? files.images
            : [files.images];
          async.mapSeries(
            Object.keys(images),
            (k, nextFile) => {
              if (
                !images[k] &&
                images[k].type.indexOf("image") === -1
              ) {
                nextCall(null, nextFile);
              } else {
                let extension = path.extname(images[k].name);
                let imageName = DS.getTime() + extension;
                let image = imageName;
                async.series(
                  [
                    (nextProc) => {
                      Uploader.uploadFile(
                        {
                          src: images[k].path,
                          dst: path.join(
                            rootPath,
                            "/uploads/product/" + image
                          ),
                        },
                        nextProc
                      );
                    },
                  ],
                  (err) => {
                    nextFile(null, image);
                  }
                );
              }
            },
            (loopErr, loopSucc) => {
              console.log('loopSucc:',loopSucc)
              fields.images = loopSucc;
              nextCall(null, fields,product);
            }
          );
        } else {
          nextCall(null, fields,product);
        }
        },
        async (fields,product,nextCall) => {
          try {
            console.log('fields.images:',fields.images)
            const findProduct = await ProductSchema.findOne({_id:product._id});
            if(!findProduct){
              return nextCall({message:MSG.PRODUCT_NOT_FND})
            }
            let editObj = {}
            if (fields.name) {
              editObj.name = fields.name
            }
            if (fields.price) {
              editObj.price = fields.price
            }
            if (fields.quantity) {
              editObj.quantity = fields.quantity
            }
            if (fields.color) {
              editObj.color = fields.color
            }
            if(fields.isActive != null) {
              editObj.isActive = fields.isActive
            }
            editObj.images = fields.images ? fields.images: product.images
             let updateProduct = await ProductSchema.findOneAndUpdate(
               {_id:product._id},
               editObj,
               {new:true}
             )
             console.log(updateProduct);
            nextCall(null, updateProduct)
        }catch (error) {
            console.log(error);
          }
        }
      ],
      (err,response) => {
        if(err) {
          return res.status(400).sendToEncode({
            status:400,
            message:err.message ||MSG.SOMETHING_WRONG,
            data:{}
          })
        } else {
          return res.status(200).sendToEncode({
            status:200,
            message:MSG.PRODUCT_UPDATE,
            data:response
          })
        }
      })

    },

    changeProductStatus: (req,res) => {
      async.waterfall(
          [
          /** these function is used for check req parameter */
          (nextCall) => {
              req.checkBody ('productId', MSG.PRODUCT_ID_REQUIRED).notEmpty ();
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
                  let product = await ProductSchema.findOne({_id:body.productId,isDeleted:false}) 
                  if(!product) {
                      return nextCall({message:MSG.PRODUCT_NOT_FND})
                  }
                  await UserSchema.findOneAndUpdate(
                      {_id:product._id},
                      {isActive:!product.isActive},
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
                  message: MSG.SUCC,
                  data: {},
              });
          }
          }
      )
    },
  
    deleteProduct: (req,res) => {
      async.waterfall([
          (nextCall) => {
              req.checkBody('productId',MSG.PRODUCT_ID_REQUIRED).notEmpty()
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
                 const product = await ProductSchema.findOne({_id:body.productId})
                  if(!product) {
                      return nextCall({message: MSG.PRODUCT_NOT_FND})
                  }
                  ProductSchema.findOneAndUpdate(
                      {_id:body.productId},
                      { isDeleted:true },
                      {new:true})
                  .exec(async (err, product) => {
                    if (err) {
                      return nextCall({ message: MSG.SOMETHING_WRONG });
                    } else {
                      nextCall(null, product);
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
                  message:MSG.PRODUCT_DELETE,
                  data:{}
              })
          }
      })

    },

}