const { C_Lampe } = require('./C_Lampe');
const { C_MySql } = require('./C_MySql');
const humanizeDuration = require("humanize-duration");

// importation des variables du fichier de configuration
const { hostname, port } = require('./config.json')

const express = require("express");
const app = express();
// initialisation d'une instance de la classe C_Mysql
const db = new C_MySql()

// #region configuration du serveur web
app.use(express.static("public"));
app.set('views', './views');
app.set('view engine', 'ejs');

// initialise le serveur web sur l'ip et port, voir config.json
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
//#endregion

// #region routage des pages
// si l'utilisateur consulte la racine de l'url : rediriger vers /accueil
app.get('/', (req, res) => {
    res.redirect('/accueil')
})

// si l'utilisateur consulte la branche accueil de l'url
app.get('/accueil', async(req, res) => {
    let data = await db.query("SELECT *, (SELECT COUNT(*) FROM scenario WHERE etat = 1) AS nb_scenario_actifs FROM scenario")
    if (data === "ERREUR") res.redirect('/erreur')

    res.render('accueil', {
        data: data
    })
})

// si l'utilisateur consulte la branche "lumiere" de l'url
app.get(['/lumiere', '/lumiere:selected'], async(req, res) => {
    let data = await db.query("SELECT * FROM lampe")
    // console.log(data)
    if (data === "ERREUR") return res.redirect('/erreur')

    res.render('lumiere', {
        data: data, // transmet le résultat de la requête SQL
        C_Lampe: new C_Lampe(), // initialise une classe C_Lampe avant de l'envoyer
        selected: req.query["selected"] // récupère de l'URL une possible query string
    });
});

// si l'utilisateur consulte la branche scenario de l'url
app.get('/scenario', async(req, res) => {
    let data = await db.query("SELECT * FROM scenario")
    if (data === "ERREUR") return res.redirect('/erreur')

    res.render('scenario', {
        data: data
    });
});

// si l'utilisateur veut créer un scénario
app.get('/scenario/creer', async(req, res) => {

    let data = await db.query("SELECT * FROM lampe")
    if (data === "ERREUR") return res.redirect('/erreur')
    res.render('scenario-creer');
});

// si l'utilisateur regarde plus en détail un scénario
app.get(['/scenario/view', '/scenario/view:id'], async(req, res) => {
    let id = req.query["id"];
    let data = await db.query(`SELECT etapes.couleur, etapes.luminosite, lampe.nom AS projecteur, lampe.type, etapes.allume, etapes.num_etape, etapes.nom_etape, etapes.delais FROM etapes INNER JOIN scenario ON scenario.id = etapes.id_scenarios INNER JOIN lampe ON etapes.lampe_id = lampe.id WHERE etapes.id_scenarios = ${id};`)
    if (data === "ERREUR") return res.redirect('/erreur')

    res.render('see-scenario', {
        data: data, // transmet le résultat de la requête SQL
    });
});

// si l'utilisateur veut créer un scénario
app.get('/planification/creer', async(req, res) => {
    let data = await db.query("SELECT * FROM scenario")
    if (data === "ERREUR") return res.redirect('/erreur')
    res.render('planification-creer');
});

// si l'utilisateur consulte la branche logs de l'url
app.get('/logs', async(req, res) => {
    let data = await db.query("SELECT logs.id, lampe.nom, lampe.type, logs.description, logs.source, logs.timestamp FROM logs JOIN lampe ON logs.lampe_id = lampe.id ORDER BY logs.id DESC LIMIT 10;")
    if (data === "ERREUR") return res.redirect('/erreur')

    res.render('logs', {
        data: data,
        humanizeDuration: humanizeDuration,
        clearDate: clearDate
    });
});

// en cas d'erreur, rediriger vers cette page
app.get('/erreur', async(req, res) =>  res.render('erreur'));
//#endregion

// #region WEBSOCKET (contrôle des projecteurs)
let lampes = new C_Lampe()

const { WebSocketServer } = require('ws')
const sockserver = new WebSocketServer({ port: 500 })

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
//#endregion

// #region fonctions
function clearDate(date)
{
    var dd = date.getDate();
    if (dd.toString().length == 1) dd = "0" + dd;
    var mm = date.getMonth();
    if (mm.toString().length == 1) mm = "0" + mm;

    var yyyy = date.getFullYear();
    
    return `${dd}/${mm}/${yyyy}`
}
// #endregion