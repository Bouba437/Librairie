const mongoose = require("mongoose");

//On crée le schéma associé
const livreSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    nom: String,
    auteur: String,
    pages: Number,
    description: String,
})

//Association avec la base de données (Model) et l'exportation
module.exports = mongoose.model("Livre", livreSchema);