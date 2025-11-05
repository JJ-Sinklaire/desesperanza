const xss = require('xss-clean');

const applySanitizer = (app) => {
    app.use(xss());
};

module.exports = { applySanitizer };