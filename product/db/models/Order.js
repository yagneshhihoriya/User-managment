import mongoose from 'mongoose'
import DS from '../../services/date'
const Schema = mongoose.Schema
const connection = require('../index')
import ED from '../../utils/encry_decry';

const schema = new Schema({

    user_id:{  
      type: Schema.Types.ObjectId, // Schema.Types.ObjectId
      ref: "tbl_user",
    },
    order_code: {
        type: String,
    },
    order_date: {
        type: Date,
        default: DS.now()
    },
    required_date: {
        type: String
    },
    shipped_date: {
        type: String,
        required:false
    },
    status:{
        type:String,
        required:true
    },
    isActive: {
        type: Boolean,   //false-not active user, true-active user
        default: true
    },
    isDeleted: {
        type: Boolean,   //false-not deleted user, true-deleted user
        default: false
    },
    updatedAt: {
      type: Date,
      default: DS.now()
    },
    createdAt: {
      type: Date,
      default: DS.now()
    }
}, {
        collection: 'tbl_order'
    })

schema.pre('save', function (next) {
    this.updatedAt = this.createdAt = this.order_date = DS.now()
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


schema.methods.comparePassword = (candidatePassword, cb) => {
    let match = false
    candidatePassword = ED.encrypt(candidatePassword);

    if (candidatePassword === this.password) {
        match = true
    }
    cb(match)
}
module.exports = connection.model(schema.options.collection, schema)
