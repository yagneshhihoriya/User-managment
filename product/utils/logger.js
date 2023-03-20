import {
  createLogger,
  format,
  transports
} from 'winston'
const {
  combine,
  timestamp,
  label,
  printf,
  colorize
} = format

const myFormat = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
})

const logger = createLogger({
  format: combine(
    label({ label: 'Product' }),
    timestamp(),
    colorize(),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: './logs/combined.log'
    })
  ],
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({
      filename: './logs/exceptions.log'
    })
  ],
  exitOnError: false
})
export default logger
