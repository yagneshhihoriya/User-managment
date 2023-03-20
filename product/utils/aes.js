import crypto from 'crypto'
const config = rootRequire('config')

export const decrypt = (encryptdata) => {
  encryptdata = Buffer.from(encryptdata, 'base64').toString('binary')
  let hashKey = crypto.createHash('sha256').update(config.cryptoKey).digest()
  let decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, config.cryptoIV)
  let decoded = decipher.update(encryptdata, 'binary', 'utf8')
  decoded += decipher.final('utf8')
  return decoded
}

export const encrypt = (cleardata) => {
  let hashKey = crypto.createHash('sha256').update(config.cryptoKey).digest()
  let encipher = crypto.createCipheriv('aes-256-cbc', hashKey, config.cryptoIV)
  let encryptdata = encipher.update(cleardata, 'utf8', 'binary')
  encryptdata += encipher.final('binary')
  let encoded = Buffer.from(encryptdata, 'binary').toString('base64')
  return encoded
}