const express = require('express');
const cookieParser = require('cookie-parser');
const proxy = require('express-http-proxy');
const { renewTokenMiddleware } = require('./middleware.ts');

const app = express();
const port = 4000;

app.use(cookieParser());
app.use(renewTokenMiddleware());
app.use('/', proxy('http://localhost:5001'));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
