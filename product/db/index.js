import mongoose from 'mongoose'
const config = rootRequire('config')
import logger from '../utils/logger'

let connection
if (config.database.use === 'mongodb') {
  connection = mongoose.createConnection(config.database.mongoURL  ,{ useNewUrlParser: true , useUnifiedTopology: true,useFindAndModify: false  }) // database name
  logger.info('Database connected successfully')
}
else {
  logger.error('Failed to connect with db')
}

module.exports = connection
