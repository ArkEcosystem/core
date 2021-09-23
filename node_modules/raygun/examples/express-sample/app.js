var config = require('config');

// Setup Raygun
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({
    apiKey: config.Raygun.Key
});

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// Set the user if we have one
raygunClient.user = function(req) {
    return 'user@example.com';
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(require('node-compass')({
    mode: 'expanded'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// Add the Raygun Express handler
app.use(raygunClient.expressHandler);

module.exports = app;