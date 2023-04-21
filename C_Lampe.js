const { C_MySql } = require("./C_MySql");

class C_Lampe extends C_MySql {

    constructor() {
        super()
        this.connect()
    }

	logs(lampeId, description) {
		const query = "INSERT INTO logs(`lampe_id`, `description`, `source`) VALUES ('"+ lampeId +"','"+ description +"','Application Web')"
        this.query(query)
	}

    allumer(lampeId) {
        const query = "UPDATE lampe SET etat = '1' WHERE id = '" + lampeId + "'"
        this.query(query)
        this.logs(lampeId, "La lampe est à présent allumé.")

    }

    eteindre(lampeId) {
		const query = "UPDATE lampe SET etat = '0'  WHERE id = '" + lampeId + "'"
        this.query(query)
        this.logs(lampeId, "La lampe est à présent éteinte.")
    }

    setLuminosite(lampeId, luminosite) {
		const query = "UPDATE lampe SET luminosite = '" + luminosite + "' WHERE id = '" + lampeId + "'"

        this.query(query)
		this.logs(lampeId, ("Luminosité modifiée, nouvelle valeur : " + (Math.floor((luminosite/255)*100))) + "%")

    }

    setCouleur(lampeId, couleur) {
		const query = "UPDATE lampe SET couleur = '" + couleur.toUpperCase().substring(1) + "' WHERE id = '" + lampeId + "'"

        this.query(query)
		this.logs(lampeId, ("Couleur modifiée, nouvelle valeur : " + couleur.toUpperCase()))
    }
}
module.exports = { C_Lampe }