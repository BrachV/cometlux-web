const { createPool } = require('mysql2'); // importe la méthode "createPool" du paquet "mysql2"
const { mysql } = require('./config.json') // importation des variables du fichier de configuration


class C_MySql {

    // le "constructeur" est systématiquement appelé lors de la création d'une nouvelle instance de la classe
    constructor() {
        this.connect()
    }

    // crée la connexion initiale entre le programme et la base de données.
    connect() {
        // la variable "mysql" est extrait du fichier config.json
        this.pool = createPool({
            connectionLimit: 50,
            host: mysql["host"],
            user: mysql["user"],
            password: mysql["password"],
            database: mysql["database"],
            port: 3306
        });
    }

    // crée puis retourne une instance de connexion à la base de données
    getConnection(callback) {
        return this.pool.getConnection(callback);
    }

    // cette fonction permet de faire une requête SQL à la base de données, elle prend en paramètre celle-ci et l'execute
    query(request) {
        return new Promise((resolve, reject) => {
            this.getConnection((err, connection) => {
                if (err) return resolve("ERREUR") // si erreur
                connection?.query(request, (err, result) => {
                    return err ? reject(err) : resolve(result);
                })
                connection?.release();
            });
        })
    }
}

// exporte la classe à travers tout le programme
module.exports = { C_MySql }