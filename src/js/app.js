var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var http = require('http');
var port = process.env.PORT || 3000;

var healthcheck = require('./routes/healthcheck');
var index = require('./routes/index');

var app = express();

app.set('port', port);
app.set('views', path.join(__dirname, '../views'));
app.engine('html', require('hogan-express'));
app.set('layout', 'index');
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

var oneDay = 86400000; // in milliseconds
app.use('/css', express.static(path.join(__dirname, '../../wwwroot/css'), { maxAge: oneDay }));
app.use('/fonts', express.static(path.join(__dirname, '../../wwwroot/fonts'), { maxAge: oneDay }));
app.use('/images', express.static(path.join(__dirname, '../../wwwroot/images'), { maxAge: oneDay }));
app.use('/js', express.static(path.join(__dirname, '../../wwwroot/js'), { maxAge: oneDay }));

app.use('/healthcheck', healthcheck);
app.use('/', index);

var server = http.createServer(app);
server.listen(port);
server.on('listening', function() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
});