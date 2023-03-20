import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import expressValidator from 'express-validator'
import initAPISVersions from './api'
import path from 'path'
import dotenv from 'dotenv'
import staticRoutes from "./routes";

dotenv.config()

const app = express()

global.rootRequire = function (name) {
  return require(`${__dirname}/${name}`)
}
global.rootPath = __dirname;
global.loginPage = "";
global.appLogo = "";
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(expressValidator({
  customValidators: {
    gte: function (param, num) {
      return param >= num
    }
  }
}))

app.use(cookieParser())

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name, Authorization,authorization ,sourceofrequest')
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  if ('OPTIONS' == req.method) {
    return res.sendStatus(200);
  } else {
    next();
  }
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/admin', express.static(path.join(__dirname, "admin/build")));
app.use("/website", express.static(path.join(__dirname, "website/build")));
app.get("/success", staticRoutes);
app.get("/error", staticRoutes);

app.get("/*", function (req, res, next) {
  if (req.url == "/") {
    res.redirect("/admin");
  } else {
    next();
  }
});


app.get('/admin/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'admin/build', 'index.html'));
})
app.get('/website/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'website/build', 'index.html'));
})
initAPISVersions(app, '')
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err,

    })
  })
}
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {},
  })
})

module.exports = app
