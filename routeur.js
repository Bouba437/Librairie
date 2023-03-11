var express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
var routeur = express.Router();
const twig = require("twig");
const fs = require("fs");
const livreModel = require("./models/livres.modele");
const { exec } = require("child_process");

const storage = multer.diskStorage({
    destination: (requete, file, cb) => {
        cb(null, "./public/images/")
    },
    filename: (requete, file, cb) => {
        let date = new Date().toLocaleDateString().replace(/\//g, '-');
        cb(null, date + "-" + Math.round(Math.random() * 10000) + "-" + file.originalname)
    }
});

const fileFilter = (requete, file, cb) => {
    // Autoriser uniquement les fichiers jpeg, png et gif
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
      cb(null, true)
    } else {
      cb(new Error('Le type de fichier est invalide. Seuls les fichiers jpeg, png et gif sont autorisés.'), false);
    }
}

//Parametrer multer(image)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter,
})

routeur.get('/', (requete, reponse) => {
    reponse.render("accueil.html.twig");
})

routeur.get('/livres', (requete, reponse) => {
    //Afficher le livre
    livreModel.find()
            .exec()
            .then(livres => {
                reponse.render("livres/liste.html.twig", {livres: livres, message: reponse.locals.message});
            })
            .catch(error => {
                console.log(error);
            });
})

//Creation de livre
routeur.post("/livres", upload.single("image"), (requete, reponse) => {
    const {titre, auteur, pages, description} = requete.body; //Destructuration
    const livre = new livreModel({
        _id: new mongoose.Types.ObjectId(),
        // nom: requete.body.titre,
        // auteur: requete.body.auteur,
        // pages: requete.body.pages,
        // description: requete.body.description,
        nom: titre,
        auteur: auteur,
        pages: pages,
        description: description,
        image: requete.file.path.substring(14),
    });
    livre.save()
        .then(resultat => {
            console.log(resultat);
            reponse.redirect("/livres");
        })
        .catch(error => {
            console.log(error);
        })
})

//Afficher un livre
routeur.get("/livres/:id", (requete, reponse) => {
    livreModel.findById(requete.params.id)
            .exec()
            .then(livre => {
                reponse.render("livres/livre.html.twig", {livre: livre, isModification: false});
            })
            .catch(error => {
                console.log(error);
            })
})

//Accéder u formulaire de modification
routeur.get("/livres/modification/:id", (requete, reponse) => {
    livreModel.findById(requete.params.id)
            .exec()
            .then(livre => {
                reponse.render("livres/livre.html.twig", {livre: livre, isModification: true});
            })
            .catch(error => {
                console.log(error);
            })
})

//Modification livre
routeur.post("/livres/modificationServer", (requete, reponse) => {
    const {titre, auteur, pages, description} = requete.body;
    const livreUpdate = {
        nom: titre,
        auteur: auteur,
        pages: pages,
        description: description,
    }
    livreModel.updateOne({_id: requete.body.identifiant}, livreUpdate)
            .exec()
            .then(resultat => {
                // console.log(resultat);
                if(resultat.modifiedCount < 1) throw new Error("La demande de modification a échoué")
                requete.session.message = {
                    type: 'success',
                    contenu: `Les modifications ont été prises en compte`,
                }
                reponse.redirect("/livres")
            })
            .catch(error => {
                requete.session.message = {
                    type: 'danger',
                    contenu: error.message,
                }
                reponse.redirect("/livres")
            })
})

//p
routeur.post("/livres/updateImage", upload.single("image"), (requete, reponse) => {
    var livre = livreModel.findById(requete.body.identifiant)
    .select("image")
    .exec()
    .then(livre => {
        fs.unlink("./public/images/"+livre.image, error => {
            console.log(error);
        })
        const livreUpdate = {
            image : requete.file.path.substring(14)
        }
        livreModel.updateOne({_id:requete.body.identifiant}, livreUpdate)
        .exec()
        .then(resultat => {
            reponse.redirect("/livres/modification/"+requete.body.identifiant)
        })
        .catch(error => {
            console.log(error);
        })
    });
   
})

//Modification image (m)
// routeur("/livres/updateImage", upload.single("image"), (requete, reponse) => {
//     var livre = livreModel.findById(requete.body.identifiant)
//         //Suppression de l'image
//         .select("image")
//         .exec()
//         .then(livre => {
//             fs.unlink("./public/images/"+ livre.image, error => {
//                 console.log(error);
//             }) 
//             const livreUpdate = {
//                 image: requete.file.path.substring(14)
//             }
//             livreModel.updateOne({_id: requete.body.identifiant}, livreUpdate)
//                 .exec()
//                 .then(resultat => {
//                     reponse.redirect("/livres/modification/"+requete.body.identifiant)
//                 })
//                 .catch(error => {
//                     console.log(error);
//                 })
//         });
// })


//Spprimer un livre
routeur.post("/livres/delete/:id", (requete, reponse) => {
    const id_livre = requete.params.id; // Récupérer l'ID du livre à supprimer
    let livre = livreModel.findById(requete.params.id)
                    //Suppression de l'image
                    .select("image")
                    .exec()
                    .then(livre => {
                        fs.unlink("./public/images/"+ livre.image, error => {
                            console.log(error);
                        })
                        //Suppression du livre
                        livreModel.deleteOne({_id: requete.params.id})
                            .exec()
                            .then(resultat => {
                                requete.session.message = {
                                    type: 'success',
                                    contenu: `Suppression effectuée pour le livre avec l'ID ${id_livre}`,
                                }
                                reponse.redirect('/livres');
                            })
                            .catch(error => {
                                console.log(error);
                            })
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