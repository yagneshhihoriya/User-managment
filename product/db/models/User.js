import mongoose from 'mongoose'
import DS from '../../services/date'
const Schema = mongoose.Schema
const connection = require('../index')
import ED from '../../utils/encry_decry';

const schema = new Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        required: false
    },
    phoneNo:{
        type:String,
        required:true
    },
    password: {
        type: String,
        required: true
    },
    accessToken: {
        type: String
    },
    resetToken: {
        type: String
    },
    userType: {
        type: Number //1-Admin ,2-User
      },
    webPushToken : {
      type: String,
      default: ''
    },
    image: {
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
    role:{
        type:Number,
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
        collection: 'tbl_user'
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


schema.methods.comparePassword = (candidatePassword, cb) => {
    let match = false
    candidatePassword = ED.encrypt(candidatePassword);

    if (candidatePassword === this.password) {
        match = true
    }
    cb(match)
}
module.exports = connection.model(schema.options.collection, schema)
