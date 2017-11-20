var express = require('express');
var app = express();
var formidable = require('formidable');
var http = require('http');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://hoiki:password@ds141514.mlab.com:41514/hoikitest';

//Alternative way to use cookies:
var session = require('cookie-session');
app.use(session({
    name: 'session',
    keys: ['key1', 'key2']
}));
// req.session.userid
// req.session = null;

app.set('view engine', 'ejs');

app.get("/", function(req, res) {
    res.status(200);
    var msg = req.query.message;
    if (!msg)
        msg = "";
    //if cookie has userid -> logined -> redirect to /read
    //else not login -> show login page

    if (req.session.userid) {
        res.redirect('/read');
    } else {
        res.render("login", { message: msg });
    }
});

app.post("/login_auth", function(req, res) {
    res.status(200);

    //query the database to check password
    //if ok: cookie, redirect to /read
    //if not ok: redirect to / with error message


    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var userid = fields.name;
        var password = fields.password;

        if (!userid || !password) {
            var error = "Please enter both fields.";
            res.redirect('/?message=' + error);
        } else {
            MongoClient.connect(mongourl, function(err, db) {
                assert.equal(err, null);
                db.collection('users').findOne({ user_id: userid }, function(err, result) {
                    if (result) {
                        //have this user, check password
                        if (result.password == password) {
                            console.log("Login sucess");
                            //Retrieve the cookie
                            if (!req.session.userid) {
                                console.log(req.session.userid);
                                //set cookie:
                                req.session.userid = userid
                            }
                            //Error in this line:
                            res.redirect('/read');
                        } else {
                            console.log("Password not match");
                            var msg = "Password not match";
                            res.redirect('/?message=' + msg);
                        }

                    } else {
                        //dont have this user (userid/password error)
                        console.log("No this user");
                        var msg = "No this user";
                        res.redirect('/?message=' + msg);
                    }

                });
            });
        }
    });

});

app.get("/register", function(req, res) {
    res.status(200);
    var err = req.query.errorMessage;
    if (!req.query.errorMessage)
        err = "";
    //if cookie has userid -> logined -> redirect to /read
    //else not login -> show register page
    if (req.session.userid) {
        res.redirect('/read');
    } else {
        res.render("register", { errorMessage: err });
    }
});

app.post("/reg_auth", function(req, res) {
    res.status(200);
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var register_userid = fields.registerName;
        var register_password = fields.registerPassword;
        console.log("ID:" + register_userid + " Password:" + register_password);

        if (!register_userid || !register_password) {
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
                        db.collection('users').insertOne({ user_id: register_userid, password: register_password }, function(err, result) {
                            assert.equal(err, null);
                            console.log("Insert was successful!");
                            console.log(JSON.stringify(result[0]));
                            var message = "";
                            if (err) {
                                message = "Account creation error";
                            } else {
                                message = "Your account have been created";
                            }
                            console.log(message);
                            res.redirect('/?message=' + message);
                        });
                    }
                });
            });

        }
    });

});


app.get("/read", function(req, res) {
    res.status(200);
    res.end("You have login your account!!!");
    //res.render("read", {});
});

app.get("/logout", function(req, res, next) {
    req.session = null;
    // res.clearCookie("userid");
    res.end("You have logout your account!!!")
});

app.listen(process.env.PORT || 8099);