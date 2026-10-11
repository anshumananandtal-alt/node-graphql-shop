const config = require('dotenv').config({ quiet: true})
const path = require('path');
const fs = require('fs')
const https = require('https')
const crypto = require('crypto')
const express = require('express');
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const multer = require('multer')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf')
const flash = require('connect-flash')
const errorController = require('./controllers/error');
const User = require('./models/user');
const FILE_REGEX = /^image\/(png|jpe?g|webp)$/;
const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@node.3l7dvs8.mongodb.net/${process.env.DEFAULT_DATABASE}`;
const csrfProection = csrf();
const { graphqlHTTP } = require('express-graphql');
const schema  = require('./graphql/schema');
const rootValue = require('./graphql/resolver');
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');
// app.use(helmet({
//         contentSecurityPolicy: {
//             directives: {
//                 defaultSrc: ["'self'"],
//                 scriptSrc: [
//                     "'self'",
//                     "'unsafe-inline'",
//                     "https://js.stripe.com"
//                 ],
//                 frameSrc: [
//                     "'self'",
//                     "https://js.stripe.com",
//                     "https://hooks.stripe.com"
//                 ],
//                 connectSrc: [
//                     "'self'",
//                     "https://api.stripe.com",
//                     "https://checkout.stripe.com"
//                 ]
//             }
//         }
//     }))
// app.use(compression())
// app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, "server.log"), { flags: 'a'})} ))
const fileStorage = multer.diskStorage({
  destination: (req, file, cb)=>{
    return cb(null, 'images')
  },
  filename: (req, file, cb)=>{
    return cb(null, crypto.randomUUID() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    console.log('#inside if',file)
    return cb(null, true);
  }

  return cb(null, false);
};

const shopRoutes = require('./routes/shop');
const { Stream } = require('nodemailer/lib/xoauth2');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));


app.use(
  multer({
    storage: fileStorage,
    fileFilter
  }).single('image')
);

app.use((req, res, next) => {
    res.setHeader(
        'Access-Control-Allow-Origin',
        'http://localhost:5173'
    );

    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );

    res.setHeader(
        'Access-Control-Allow-Credentials',
        'true'
    );

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        }
    })
);


app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: rootValue,
  graphiql: true,
  customFormatErrorFn: (err) => { 
        if(!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
    } 
}));
app.use(shopRoutes);

app.use(csrfProection);

// Make CSRF token available to EJS
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Load logged-in user
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        throw new Error("User doesn't exist");
      }

      req.user = user;
      next();
    })
    .catch(err => {
      console.log(err);

      const error = new Error(err);
      error.httpStatusCode = 500;

      next(error);
    });
});

app.use(flash());

// 404 handler
app.use(errorController.get404);

// Error handler MUST be last
// app.use((err, req, res, next) => {
//   errorController.getError(req, res, next);
// });



mongoose
  .connect(MONGODB_URI)
  .then(result => {
    // https.createServer({key: privateKey, cert: certificate}, app).listen(3000)
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
