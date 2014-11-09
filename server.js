/*==========================
 *
 *	DEPENDENCIES & GLOBAL VARIABLES
 *
==========================*/

var express = require('express');
var app = express();

//middleware
var bodyParser = require('body-parser');
var session = require('express-session');  

var port = 3000;
//routes
var index = require('./routes/index');
var room = require('./routes/room');


/*==========================
 *
 * 	MIDDLEWARE
 *
==========================*/


//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended:false}));

// parse application/json
app.use(bodyParser.json());

// session
app.use(session({
	secret: 'illusTraTions',
	cookie:{secure:true}
	}));

//js css img
app.use(express.static(__dirname+'/public'));

//jade
app.set('view engine','jade');

//views
app.set('views',__dirname+'/views');

/*==========================
 *
 *	ROUTES
 *
==========================*/

//root
app.get('/',index.root);

//room
app.post('/room',room.postRoom);


/*==========================
 *
 *	LISTENING ON PORT 3000
 *
==========================*/
app.listen(port, function(){

	console.log("listening on port "+port);
});
