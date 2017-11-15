var express = require('express');
var app = express();

app.set('view engine', 'ejs');

app.get("/", function(req,res) {
	res.status(200);
	res.render("login");	
});

app.get("/register",function(req,res){
	res.status(200);
	res.render("register")
});

app.get("/auth", function(req,res) {
	var userid = req.query.name;
	var password = req.query.password;

	//query the database to check password
	//if ok: cookie, redirect to /read
	//if not ok: redirect to / with error message

	var register_userid = req.query.registerName;
	var register_password =  req.query.registerPassword;



	//2 fields must be filled
	//user id must be unique

	//query the database to check if existing userid
	//if ok: cookie, redirect to /
	//if not ok: redirect to /register with error message
});


app.get("/read", function(req,res) {
	res.status(200);
	res.render("read", {});	
});

app.listen(process.env.PORT || 8099);
