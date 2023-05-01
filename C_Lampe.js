const { C_MySql } = require("./C_MySql");

class C_Lampe extends C_MySql {

    constructor() {
        super() // permet à la classe d'accéder aux méthodes de la classe mère
        this.connect() // initie une connexion à la base de données
    }

	logs(lampeId, description) {
		const query = "INSERT INTO logs(`lampe_id`, `description`, `source`) VALUES ('"+ lampeId +"','"+ description +"','Application Web')"
        this.query(query)
	}

    allumer(lampeId) {
        // si la demande pour modifier la luminosité concerne un ensemble de projecteurs
        if (lampeId.includes('tout')) {
            // extrait le type
            let type = lampeId.split('-')[0].toUpperCase();

            // modifie les valeurs dans la base de données
            this.query("UPDATE lampe SET etat = '1' WHERE type = '" + type + "'")

            // crée les logs dans la base de données
            this.query("SELECT id FROM lampe WHERE type = '" + type + "'").then((entrees) => entrees.forEach((entree) => this.logs(entree["id"], "La lampe est à présent allumée.")))
        }
        // sinon, si elle concerne que un seul projecteur
        else {
            // modifie la valeur dans la base de données
            this.query("UPDATE lampe SET etat = '1' WHERE id = '" + lampeId + "'")

            // crée un logs dans la base de données
            this.logs(lampeId, "La lampe est à présent allumé.")
        }

    }

    eteindre(lampeId) {
        // si la demande pour modifier la luminosité concerne un ensemble de projecteurs
        if (lampeId.includes('tout')) {
            // extrait le type
            let type = lampeId.split('-')[0].toUpperCase();

            // modifie les valeurs dans la base de données
            this.query("UPDATE lampe SET etat = '0' WHERE type = '" + type + "'")

            // crée les logs dans la base de données
            this.query("SELECT id FROM lampe WHERE type = '" + type + "'").then((entrees) => entrees.forEach((entree) => this.logs(entree["id"], "La lampe est à présent éteinte.")))
        }
        // sinon, si elle ne concerne qu'un seul projecteur
        else {
            // modifie la valeur dans la base de données
            this.query("UPDATE lampe SET etat = '0' WHERE id = '" + lampeId + "'")

            // crée un logs dans la base de données
            this.logs(lampeId, "La lampe est à présent éteinte.")
        }
    }

    setLuminosite(lampeId, luminosite) {
        // si la demande pour modifier la luminosité concerne un ensemble de projecteurs
        if (lampeId.includes('tout')) {
            // extrait le type
            let type = lampeId.split('-')[0].toUpperCase();

            // modifie les valeurs dans la base de données
            this.query("UPDATE lampe SET luminosite = '" + luminosite + "' WHERE type='" + type + "'")

            // crée les logs dans la base de données
            this.query("SELECT id FROM lampe WHERE type='" + type + "'").then((entrees) => entrees.forEach((entree) => this.logs(entree["id"], ("Luminosité modifiée, nouvelle valeur : " + (Math.floor((luminosite/255)*100))) + "%")))
        }
        // sinon, si elle concerne que un seul projecteur
        else {
            // modifie la valeur dans la base de données
            this.query("UPDATE lampe SET luminosite = '" + luminosite + "' WHERE id = '" + lampeId + "'")

            // crée un logs dans la base de données
            this.logs(lampeId, ("Luminosité modifiée, nouvelle valeur : " + (Math.floor((luminosite/255)*100))) + "%")
        }

    }

    setCouleur(lampeId, couleur) {
        // si la demande pour modifier la couleur concerne un ensemble de projecteurs
        if (lampeId.includes('tout')) {
            // extrait le type
            let type = lampeId.split('-')[0].toUpperCase();

            // modifie les valeurs dans la base de données
            this.query("UPDATE lampe SET couleur = '" + couleur.toUpperCase().substring(1) + "' WHERE type = '" + type + "'")

            // crée les logs dans la base de données
            this.query("SELECT id FROM lampe WHERE type = '" + type + "'").then((entrees) => entrees.forEach((entree) => this.logs(entree["id"], ("Couleur modifiée, nouvelle valeur : " + couleur.toUpperCase()))))
        }
        // sinon, si elle concerne que un seul projecteur
        else {
            // modifie la valeur dans la base de données
            this.query("UPDATE lampe SET couleur = '" + couleur.toUpperCase().substring(1) + "' WHERE id = '" + lampeId + "'")

            // crée un logs dans la base de données
            this.logs(lampeId, ("Couleur modifiée, nouvelle valeur : " + couleur.toUpperCase()))
        }
    }
}

// exporte la classe à travers tout le programme
module.exports = { C_Lampe }