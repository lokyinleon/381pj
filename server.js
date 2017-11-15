var express = require('express');
var app = express();
var formidable = require('formidable');
var http = require('http');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://hoiki:password@ds141514.mlab.com:41514/hoikitest';

app.set('view engine', 'ejs');

app.get("/", function(req, res) {
    res.status(200);
    var msg = req.query.message;
    if (!msg)
        msg = "";
    res.render("login", {message: msg});
});

app.get("/register", function(req, res) {
    res.status(200);
    var err = req.query.errorMessage;
    if (!req.query.errorMessage)
        err = "";
    res.render("register", { errorMessage: err });
    //res.render("register", {errorMessage: '1'})
});

app.post("/auth", function(req, res) {
	var userid = req.query.name;
	var password = req.query.password;

	//query the database to check password
	//if ok: cookie, redirect to /read
	//if not ok: redirect to / with error message

	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
	    var register_userid = fields.registerName;
	    var register_password = fields.registerPassword;
	    console.log("ID:" + register_userid + " Password:" + register_password);

	    if (!register_userid || !register_password) {
	        console.log("PK la you!")
	        var error = "Please fill in both fields.";
	        res.redirect('/register?errorMessage=' + error);
	    } else {
	        console.log("OK");
	        //database operation
	        // if userid == unique, insert userid and password to mongodb
	        // if database return OK! -> redirect /read
	        MongoClient.connect(mongourl, function(err, db) {
	            assert.equal(err, null);
	            db.collection('users').findOne({ user_id: register_userid }, function(err, result) {
	                 assert.equal(err, null);
	                if (result) {
	                    //This user id found in database
	                    //user id not unique, not insert
	                    var error = "This username has been used. Try another user name."
	                    res.redirect('/register?errorMessage=' + error);
	                } else {
	                    //userid is unique
	                    //do insert 
	                    console.log("insert");
	                    db.collection('users').insertOne({user_id:register_userid,password:register_password},function(err,result) {
		                assert.equal(err,null);
		                console.log("Insert was successful!");
		                console.log(JSON.stringify(result[0]));
		                var message = "";
		                if(err){
                        	message = "Account creation error";
		                } else{
		                	message = "Your account have been created";
		                }
		                console.log(message);
		                res.redirect('/?message='+message);
	});
	                }
	                //if ok: redirect to /
					//if not ok: redirect to /register with error message

	            });
	        });

	    }
	});

});


app.get("/read", function(req, res) {
    res.status(200);
    res.render("read", {});
});

app.listen(process.env.PORT || 8099);