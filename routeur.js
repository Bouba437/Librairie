var express = require("express");
var routeur = express.Router();
const twig = require("twig");
const livreModel = require("./models/livres.modele");

routeur.get('/', (requete, reponse) => {
    reponse.render("accueil.html.twig");
})

routeur.get('/livres', (requete, reponse) => {
    //Afficher le livre
    livreModel.find()
            .exec()
            .then(livres => {
                reponse.render("livres/liste.html.twig", {livres: livres});
            })
            .catch(error => {
                console.log(error);
            });
})

routeur.get("/livres/:id", (requete, reponse) => {
    livreModel.findById(requete.params.id)
            .exec()
            .then(livre => {
                reponse.render("livres/livre.html.twig", {livre: livre});
            })
            .catch(error => {
                console.log(error);
            })
})

//Gère l'erreur 404
routeur.use((requete, reponse, suite) => {
    const error = new Error("Page non trouvé");
    error.status = 404;
    suite(error);//envoi à la route ci-dessous avec "errror" générée
})

//Gère toutes les erreurs
routeur.use((error, requete, reponse) => {
    reponse.status(error.status || 500);
    reponse.end(error.message);
})

module.exports = routeur;