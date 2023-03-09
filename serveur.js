const express = require("express");
const server = express();
const morgan = require("morgan");
const router = require("./routeur");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

//Connexion avec la base de données
mongoose.connect("mongodb://localhost/biblio", {useNewUrlParser: true, useUnifiedTopology: true});

//Middleware
server.use(express.static("public"));
server.use(morgan("dev"));
server.use(bodyParser.urlencoded({extended:false}));
server.use("/", router);

server.listen(3000);



