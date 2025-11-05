const session = require('express-session');

const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: parseInt(process.env.SESSION_MAX_AGE, 10),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
};

const applySession = (app) => {
    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }
    app.use(session(sessionOptions));
};

module.exports = { applySession };