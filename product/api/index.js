/**
 * Initilize all api verions according to application release
 **/
module.exports = function (app, apiBase) {
  app.use(apiBase, require('./routes/auth'))
}
