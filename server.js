var express = require('express');
var app = express();
var formidable = require('formidable');
var http = require('http');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://hoiki:password@ds141514.mlab.com:41514/hoikitest';
var fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');

app.use(bodyParser.json())

//Alternative way to use cookies:
var session = require('cookie-session');
app.use(session({
    name: 'session',
    keys: ['key1', 'key2']
}));
// req.session.userid
// req.session = null;

app.use(fileUpload());

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
                                console.log("req.session.userid: " + req.session.userid);
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

    var msg = "Please login!";
    if (!req.session.userid) {
        res.render("login", { message: msg });

    }


    console.log("query string: " + JSON.stringify(req.query));
    MongoClient.connect(mongourl, function(err, db) {
        assert.equal(err, null);
        //
        var restaurants = [];
        cursor = db.collection('restaurants').find(req.query)

        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                restaurants.push(doc);
                // console.log(doc);
                // console.log(restaurants);
            } else {
                // console.log(restaurants)
                res.render("show_all", { userid: req.session.userid, r: restaurants, criteria: JSON.stringify(req.query) });
            }
        });

        //

    });

});

app.get("/display", function(req, res) {
    res.status(200);
    // res.write(JSON.stringify(req.query));

    var msg = "Please login!";

    if (!req.session.userid) {
        res.render("login", { message: msg });
    }
    //handle no req.query._id

    MongoClient.connect(mongourl, function(err, db) {
        assert.equal(err, null);
        console.log('Connected to MongoDB\n');
        db.collection('restaurants').findOne({ _id: ObjectId(req.query._id) }, function(err, doc) {
            // console.log(doc);
            res.render("display_one", { r: doc, _id: req.query._id });

        });

    });
    // res.end("You are in display page");
});

app.get("/new", function(req, res) {
    res.status(200);
    //have login -> create page
    //not login -> show login page
    if (req.session.userid) {
        res.render("create");
    } else {
        res.render('login', { message: "Please login!" });
    }

});

app.get("/rate", function(req, res) {
    res.status(200);
    //have login -> create page
    //not login -> show login page
    if (req.session.userid) {
        res.render("rate", { _id: req.query._id, userid: req.session.userid });
    } else {
        res.render('login', { message: "Please login!" });
    }

});

app.post("/rate-logic", function(req, res) {
    res.status(200);
    //input text field in form
    console.log(req.body);

    //create a json object to insert in mongoDB
    //handle if dont input corresponding data

    MongoClient.connect(mongourl, function(err, db) {
        assert.equal(err, null);
        db.collection('restaurants').findOne({ "_id": ObjectId(req.body._id) }, function(err, resultCount) {
            assert.equal(err, null);
            if (resultCount.grades) {
                for (var i in resultCount.grades) {
                    if (resultCount.grades[i].user == req.session.userid) {
                        res.end('You have rated this restaurant before.');
                        db.close();
                    }
                }

                try {
                    db.collection('restaurants').updateOne({ "_id": ObjectId(req.body._id) }, { $push: { "grades": { "user": req.body.userid, "score": req.body.score } } }, function(err, result) {
                        res.end('Restaurant rating has been written to MongoDB.');
                    });
                } catch (e) {

                }

            }
        });
    });


});

app.post("/create-logic", function(req, res) {
    res.status(200);
    //input text field in form
    console.log(req.body);
    //uploaded photo data 
    var photoBuffer = "";
    var mimetype = "";
    if (req.files.photo) {
        photoBuffer = req.files.photo.data;
        mimetype = req.files.photo.mimetype;
    }

    //create a json object to insert in mongoDB
    //done: auto increment on restaurant_id
    //handle if dont input corresponding data


    MongoClient.connect(mongourl, function(err, db) {
        db.collection('restaurants').count({}, function(err, noOfDocument) {
            var count = noOfDocument;
            console.log("Count: " + count + 1);
            var new_r = {
                restaurant_id: count + 1,
                name: req.body.name,
                borough: req.body.borough,
                cuisine: req.body.cuisine,
                address: {
                    street: req.body.street,
                    building: req.body.building,
                    zipcode: req.body.zipcode,
                    coord: [req.body.lat, req.body.lon]
                },
                grades: [],
                owner: req.session.userid,
                photo: new Buffer(photoBuffer).toString('base64'),
                photo_mimetype: mimetype,

            };
            //Todo: Insert to db when the new_r is ready
            MongoClient.connect(mongourl, function(err, db) {
                assert.equal(err, null);
                db.collection('restaurants').insertOne(new_r, function(err, result) {
                    assert.equal(err, null);
                    //db.close();
                    res.status(200);
                    //res.end('restaurant was inserted into MongoDB!');
                    db.collection('restaurants').findOne({ restaurant_id: new_r.restaurant_id }, function(err, doc) {
                        //console.log(doc);
                        db.close();
                        res.render("display_one", { r: doc, _id: req.query._id });

                    });




                })
            });

        });
    });

})

app.get('/gmap', function(req, res) {
    res.render('gmap.ejs', { lat: req.query.lat, lon: req.query.lon, title: req.query.title });
});

app.get("/logout", function(req, res) {
    req.session = null;
    // res.clearCookie("userid");
    res.render('login', { message: "You have logout your account!!!" });
    // res.end("You have logout your account!!!")
});

app.get("/test", function(req, res) {
    MongoClient.connect(mongourl, function(err, db) {
        assert.equal(err, null);
        db.collection('restaurants').remove(function(err, result) {
            db.close();
            res.end("removed");
        });
    });
});

app.get("/edit", function(req, res) {
    res.status(200);

    var msg = "Please login!";
    if (!req.session.userid) {
        res.render("login", { message: msg });


    }
    //req.query.owner   
    //if req.session.userid==owner  redirect to update.ejs
    // else res.end("");

    if (req.session.userid == req.query.owner) {
        console.log("Enter");
        MongoClient.connect(mongourl, function(err, db) {
            assert.equal(err, null);
            console.log('Connected to MongoDB\n');
            db.collection('restaurants').findOne({ _id: ObjectId(req.query._id) }, function(err, doc) {
                // console.log(doc);
                console.log("Request ID*****:" + req.query._id);
                res.render("update", { r: doc });

            });

        });
    } else {
        console.log("No Authorized");
        res.end("Error! You are not authorized to edit!!! ");
    }


});


app.post("/update-logic", function(req, res) {
    res.status(200);

    var photoBuffer = "";
    var mimetype = "";
    var criteria = {};
    
    if (req.files.photo) {
        photoBuffer = req.files.photo.data;
        criteria.photo = new Buffer(photoBuffer).toString('base64');
        mimetype = req.files.photo.mimetype;

        if(mimetype.indexOf("image") == -1){
            criteria.photo == "";
        }

        criteria.photo_mimetype = mimetype;
        console.log("mimetype:" + mimetype);
    }

    
    var address = {
        coord: []
    };

    

    // if (photoBuffer) {
    //     criteria.photo = new Buffer(photoBuffer).toString('base64');
    // }

    
    for (key in req.body) {
        if (req.body[key] != "" && key != "_id") {
            if (key == "street") {
                address.street = req.body[key];
            } else if (key == "building") {
                address.building = req.body[key];
            } else if (key == "zipcode") {
                address.zipcode = req.body[key];
            } else if (key == "lat") {
                address.coord[0] = req.body[key];
            } else if (key == "lon") {
                address.coord[1] = req.body[key];
            } else {
               criteria[key] = req.body[key]; 
            }
            
        }

    }

    criteria.address = address    
    console.log(criteria)

    // photo: new Buffer(photoBuffer).toString('base64'),


    // res.redirect('/display?_id=' + req.body._id);

    // console.log("/update-logic: " + JSON.stringify(criteria));

    MongoClient.connect(mongourl, function(err, db) {
        assert.equal(err, null);
        db.collection('restaurants').updateOne({ _id: ObjectId(req.body._id) }, { $set: criteria }, function(err, result) {
            assert.equal(err, null);
            console.log("1 document updated");
            db.close();
            res.redirect('/display?_id=' + req.body._id);
        });

    });

});

app.get("/remove", function(req, res) {
    console.log("Delete", req.query._id);
    if (req.session.userid == req.query.owner) {
        MongoClient.connect(mongourl, function(err, db) {
            db.collection("restaurants").remove({ _id: ObjectId(req.query._id) }, function(err, obj) {
                if (err) throw err;
                console.log(obj.result.n + " document(s) deleted");
                db.close();
                res.end('1 document deleted');
                // res.redirect('/read');
            });
        });
    } else {
        console.log("No Authorized");
        res.end("Error No Authorized!!!");
    }
});

app.post('/api/restaurant/create', function(req, res) {
    console.log('/api/restaurant/create');
    console.log(req.body);


    //Handle photo input
    // var mimetype = "";
    // if (req.files.photo) {
    //     photoBuffer = req.files.photo.data;
    //     mimetype = req.files.photo.mimetype;
    // }

    // res.end(mimetype);

    //Name & owner are mandatory
    //Nothing in name, req.body.name=false , !false -> true, enter if block
    if (!req.body.name || !req.body.owner) {
        res.end(JSON.stringify({ "status": "failed" }));
    } else {
        // create restaurant document

        // var new_r = {}
        // for (key in req.body){
        //     new_r[key] = req.body[key]
        // }




        MongoClient.connect(mongourl, function(err, db) {
            assert.equal(err, null);

            db.collection('restaurants').count({}, function(err, noOfDocument) {
                var count = noOfDocument;
                console.log("Count: " + count + 1);
                var new_r = {
                    restaurant_id: count + 1,
                    name: req.body.name,
                    borough: req.body.borough,
                    cuisine: req.body.cuisine,
                    address: {
                        street: req.body.address.street,
                        building: req.body.address.building,
                        zipcode: req.body.address.zipcode,
                        coord: [req.body.address.coord[0], req.body.address.coord[1]]
                    },
                    grades: [],
                    owner: req.body.owner,
                    photo: req.body.photo,
                    photo_mimetype: req.body.mimetype,
                };



                db.collection('restaurants').insertOne(new_r, function(err, result) {
                    assert.equal(err, null);
                    if (err) {
                        //have error -> insert fail
                        db.close();
                        res.end(JSON.stringify({ "status": "failed" }));
                        // {
                        //   status: failed
                        // }
                    } else {
                        //no error -> insert ok , need field "_id" 
                        db.collection('restaurants').findOne({ restaurant_id: new_r.restaurant_id }, function(err, doc) {
                            //console.log(doc);
                            db.close();
                            var response = {
                                "status": "ok",
                                "_id": doc._id
                            }
                            res.end(JSON.stringify(response));
                        });

                    }
                });

            });

        });
    }

});

app.get('/api/restaurant/read/:key/:value', function(req, res) {

    var criteria = {};
    criteria[req.params.key] = req.params.value;
    console.log(criteria);
    
    //database operation
    MongoClient.connect(mongourl, function(err, db) {
        assert.equal(err, null);
        var restaurants = [];

        cursor = db.collection('restaurants').find(criteria)

        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                restaurants.push(doc);
                // console.log(doc);
                // console.log(restaurants);
            } else {
                // console.log(restaurants)
                if (restaurants.length>0){
                    res.end(JSON.stringify(restaurants));
                } else {
                    res.end(JSON.stringify({}));
                }
                
            }
        });
    });
});

function getNextID() {
    MongoClient.connect(mongourl, function(err, db) {
        db.collection('restaurants').count({}, function(err, count) {
            return count + 1;
        });
    });

}

app.listen(process.env.PORT || 8099);