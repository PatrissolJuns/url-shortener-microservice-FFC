'use strict'

let routes = require('./api/routes');
const path = require('path');
const express = require('express');

const app = express();

// we allow cross origin
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// we set the static public folder
app.use(express.static('public'));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// we execute the main programme
routes(app);

// listen for requests
let listener = app.listen(process.env.PORT || 3000, function() {
    console.log('The Node.js app is listening on ' + listener.address().port);
});
