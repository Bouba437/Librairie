const express = require("express");
const server = express();
const morgan = require("morgan");
const router = require("./routeur");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
server.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  }))

//Connexion avec la base de données
mongoose.connect("mongodb://localhost/biblio", {useNewUrlParser: true, useUnifiedTopology: true});

//Middleware
server.use(express.static("public"));
server.use(morgan("dev"));
server.use(bodyParser.urlencoded({extended:false}));
server.set('trust proxy', 1)

//Traitement des variables de session
server.use((requete, reponse, suite) => {
    reponse.locals.message = requete.session.message;
    //Supprimer la variable de session
    delete requete.session.message;
    suite();
})

server.use("/", router);

server.listen(3000);



