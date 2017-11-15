var express = require('express');
var app = express();
var formidable = require('formidable');

app.set('view engine', 'ejs');

app.get("/", function(req, res) {
    res.status(200);
    res.render("login");
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
        }
    });


    //2 fields must be filled

    //user id must be unique


    //query the database to check if existing userid
    //if ok: cookie, redirect to /
    //if not ok: redirect to /register with error message
});


app.get("/read", function(req, res) {
    res.status(200);
    res.render("read", {});
});

app.listen(process.env.PORT || 8099);