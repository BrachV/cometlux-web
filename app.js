const { C_Lampe } = require('./C_Lampe');
const { C_MySql } = require('./C_MySql');

const hostname = '192.168.0.101';
const port = 3000;

const express = require("express");
const app = express();

app.use(express.static("public"));
const db = new C_MySql()

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.redirect('/accueil')
})
app.get('/lumiere', async(req, res) => {
    let data = await db.query("SELECT * FROM lampe")

    res.render('lumiere', {
        data: data,
        C_Lampe: new C_Lampe()
    });
});
app.get('/scenario', async(req, res) => {
    let data = await db.query("SELECT * FROM scenario")

    res.render('scenario', {
        data: data
    });
});
app.get('/logs', async(req, res) => {
    let data = await db.query("SELECT logs.id, lampe.nom, logs.description, logs.source, logs.timestamp FROM logs JOIN lampe ON logs.lampe_id = lampe.id ORDER BY logs.id DESC LIMIT 20;")

    res.render('logs', {
        data: data
    });
});
app.get('/accueil', async(req, res) => {
    let data = await db.query("SELECT * FROM lampe")

    res.render('accueil', {
        etat: {
            hue: 'ON',
            prow: 'ON',
            prox: 'OFF'
        }
    })
})


app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

let lampes = new C_Lampe()

const { WebSocketServer } = require('ws')
const sockserver = new WebSocketServer({ port: 443 })

sockserver.on('connection', ws => {
    // quelqu'un s'est connecté
    console.log('Nouveau client connecté')

    // envoi une confirmation
    ws.send('Connexion établie')

    // le client s'est déconnecté
    ws.on('close', () => console.log('Un client s\'est déconnecté '))

    // le serveur reçoit un message
    ws.on('message', data => {
        // initialise  un objet à partir de la chaine de caractères
        let objet = JSON.parse(data)

        console.log(`Nouveau message: \n- Lampe id  : ${objet.id}\n- Type : ${objet.type}\n- Valeur : ${objet.valeur}`)

        // en fonction du type
        switch(objet.type)
        {
            case 'luminosite':
                lampes.setLuminosite(objet.id, objet.valeur);
                break;

            case 'couleur': 
                lampes.setCouleur(objet.id, objet.valeur);
                break;

            case 'allume': 
                lampes.allumer(objet.id);
                break;

            case 'eteindre': 
                lampes.eteindre(objet.id);
                break;
        }
    })

    // erreur
    ws.onerror = function () {
      console.log('Erreur')
    }
})