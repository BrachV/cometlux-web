const { createPool } = require('mysql2');

class C_MySql {
    constructor() {
        this.connect()
    }


    connect() {
        this.pool = createPool({
            connectionLimit: 50,
            host: "192.168.0.20",
            user: "Admin",
            password: "cocorico%*",
            database: "cometlux",
            port: 3306
        });
    }

    getConnection(callback) {
        return this.pool.getConnection(callback);
    }

    query(request) {
        console.log(request)
        return new Promise((resolve, reject) => {
            this.getConnection((err, connection) => {
                // console.log(connection)
                connection.query(request, (err, result) => {
                    // console.log("resultat : " + result)
                    return err ? reject(err) : resolve(result);
                })
                connection.release();
            });
        })
    }
}
module.exports = { C_MySql }