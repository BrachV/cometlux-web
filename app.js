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
    let data = await db.query("SELECT *, (SELECT COUNT(*) FROM planification WHERE etat = 1) AS nb_scenario_actifs FROM planification")
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
    res.render('scenario-creer', {
        data: data, // transmet le résultat de la requête SQL
    });
});

// si l'utilisateur regarde plus en détail un scénario
app.get(['/scenario/view', '/scenario/view:id'], async(req, res) => {
    let id = req.query["id"];
    let data = await db.query(`SELECT etapes.id_scenarios AS scenarioId, etapes.couleur, etapes.luminosite, lampe.nom AS projecteur, lampe.type, etapes.allume, etapes.num_etape, etapes.delais FROM etapes INNER JOIN scenario ON scenario.id = etapes.id_scenarios INNER JOIN lampe ON etapes.lampe_id = lampe.id WHERE etapes.id_scenarios = ${id};`)
    if (data === "ERREUR") return res.redirect('/erreur')

    res.render('scenario-view', {
        data: data, // transmet le résultat de la requête SQL
    });
});

// si l'utilisateur modif un scénario
app.get(['/scenario/modif', '/scenario/modif:id'], async(req, res) => {
    let id = req.query["id"];
    let data = await db.query(`SELECT etapes.id_scenarios AS scenarioId, scenario.nom AS nomScenario, scenario.description AS descriptionScenario, etapes.couleur, etapes.luminosite, lampe.nom AS projecteur, lampe.type, lampe.id AS lampeId, etapes.allume, etapes.num_etape, etapes.delais FROM etapes INNER JOIN scenario ON scenario.id = etapes.id_scenarios INNER JOIN lampe ON etapes.lampe_id = lampe.id WHERE etapes.id_scenarios = ${id};`)
    if (data === "ERREUR") return res.redirect('/erreur')
    let projecteurs = await db.query(`SELECT * FROM lampe;`)
    if (projecteurs === "ERREUR") return res.redirect('/erreur')

    res.render('scenario-modif', {
        data: data, // transmet le résultat de la requête SQL
        projecteurs: projecteurs
    });
});



// si l'utilisateur veut créer un scénario
app.get('/planification', async(req, res) => {
    let data = await db.query("SELECT * FROM planification")
    if (data === "ERREUR") return res.redirect('/erreur')
    res.render('planification', {
        data: data, // transmet le résultat de la requête SQL
    });
});
// si l'utilisateur veut créer un scénario
app.get('/planification/creer', async(req, res) => {
    let data = await db.query("SELECT * FROM scenario")
    if (data === "ERREUR") return res.redirect('/erreur')
    res.render('planification-creer', {
        data: data
    });
});
// si l'utilisateur modif un scénario
app.get(['/planification/modif', '/planification/modif:id'], async(req, res) => {
    let id = req.query["id"];
    let data = await db.query(`SELECT * FROM planification WHERE id='${id}';`)
    if (data === "ERREUR") return res.redirect('/erreur')
    let scenario = await db.query(`SELECT * FROM scenario;`)
    if (scenario === "ERREUR") return res.redirect('/erreur')

    res.render('planification-modif', {
        data: data, // transmet le résultat de la requête SQL
        scenario: scenario
    });
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
    ws.on('message', async data => {

        // initialise  un objet à partir de la chaine de caractères
        let objet = JSON.parse(data)
        console.log(objet)

        // création d'une planification
        if (objet?.origine === "planif-creer")
        {
            console.log("PLANIFICATION", objet)
            // crée la planification dans la table planification
            await db.query(`INSERT INTO planification (id_scenario, nom, heure, minute, jours, repetition, etat) VALUES ('${objet.scenarioId}', '${objet.nom}', '${objet.heure}', '${objet.minute}', '${objet.jours}', '${objet.repetition}', '${objet.etat}');`)
            return;
        }
        // modification d'une planification
        if (objet?.origine === "planif-modif")
        {
            console.log("PLANIFICATION", objet)
            // crée la planification dans la table planification
            await db.query(`UPDATE planification SET id_scenario='${objet.scenarioId}', nom='${objet.nom}', heure='${objet.heure}', minute='${objet.minute}', jours='${objet.jours}', repetition='${objet.repetition}', etat='${objet.etat}' WHERE id='${objet.id}'`)
            return;
        }
        // supprimer une planification
        if (objet?.origine === "planif-supprimer")
        {
            console.log("PLANIFICATION", objet)
            // crée la planification dans la table planification
            await db.query(`DELETE FROM planification WHERE id='${objet.id}'`)
            return;
        }




        // modifier un scénario
        if (objet[0]?.origine === "modif" || objet.origine === "modif")
        {
            let scenarioId = objet[0].scenarioId;
            await db.query(`UPDATE scenario SET nom='${objet[0].nom}', description='${objet[0].description}' WHERE id='${scenarioId}'`)
            objet.shift();
            for (let i = 0; i < objet.length; i++) await db.query(`UPDATE etapes SET allume='${objet[i].allume ? "1":"0"}', luminosite='${objet[i].luminosite}', lampe_id='${objet[i].projecteurId}', couleur='${objet[i].couleur.toUpperCase().substring(1)}', delais='${objet[i].delais}' WHERE id_scenarios='${scenarioId}' AND num_etape='${objet[i].numeroEtape}'`)
            
            return;
        }

        // supprimer un scénario
        if (objet?.scenarioId != undefined && objet?.origine === "supprimer")
        {
            await db.query(`DELETE FROM etapes WHERE id_scenarios='${objet.scenarioId}'`)
            await db.query(`DELETE FROM scenario WHERE id='${objet.scenarioId}'`)
            return;
        }

        // création d'un scénario
        if (objet[0]?.origine === "créer")
        {
            console.log("SCENARIO", objet[0])
            // crée le scénario dans la table scénario
            let scenario = await db.query(`INSERT INTO scenario (nom, description) VALUES ('${objet[0].nom}', '${objet[0].description}');`)
            
            // crée toutes les étapes dans la table etapes
            objet.shift(); // enlève le premier élément (nom et description du scénario) du tableau des données
            let etapesListQuery = "";
            for (let i = 0; i < objet.length; i++) 
            etapesListQuery+= ` ('${objet[i].numeroEtape}', '${scenario.insertId}', '${objet[i].allume ? "1":"0"}', '${objet[i].luminosite}', '${objet[i].projecteurId}', '${objet[i].couleur.toUpperCase().substring(1)}', '${objet[i].delais}')${i != objet.length-1  ? ",":";"} `

            await db.query(`INSERT INTO etapes (num_etape, id_scenarios, allume, luminosite, lampe_id, couleur, delais) VALUES ${etapesListQuery}`)
            return;
        }
        
        // en fonction du type [LAMPES]
        if (objet.type)
        {
            console.log(`Nouveau message: \n- Lampe id  : ${objet.id}\n- Type : ${objet.type}\n- Valeur : ${objet.valeur}`)
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