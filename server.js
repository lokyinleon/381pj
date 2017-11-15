var express = require('express');
var app = express();

app.set('view engine', 'ejs');

app.get("/", function(req,res) {
	res.status(200);
	res.render("sign_in");	
});

app.listen(process.env.PORT || 8099);
