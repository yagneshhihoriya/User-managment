import mongoose from 'mongoose'
import DS from '../../services/date'
const Schema = mongoose.Schema
const connection = require('../index')
// const ED = rootRequire('utils/encry_decry')

const schema = new Schema({
  name: {
    type: String,
  },
  price: {
    type: Number,
  },
  images: [
    {
      type: String,
    },
  ],
  quantity: {
    type: String,    
  },
  color: {
    type: String,    
  },
  isActive: {
    type: Boolean,   //false-not active user, true-active user
    default: true
  },
  isDeleted: {
    type: Boolean,   //false-not deleted user, true-deleted user
    default: false
  },
  createdAt: {
    type: Date,
    default: DS.now()
  },
  updatedAt: {
    type: Date,
    default: DS.now()
  }
}, {
  collection: 'tbl_product'
})

schema.pre('save', function (next) {
  this.updatedAt = this.createdAt = DS.now()
  next()
})

schema.pre('update', function (next) {
  this.update({}, { $set: { updatedAt: DS.now() } })
  next()
})


schema.pre('findOneAndUpdate', function (next) {
  this.update({}, { $set: { updatedAt: DS.now() } })
  next()
})



module.exports = connection.model(schema.options.collection, schema)
