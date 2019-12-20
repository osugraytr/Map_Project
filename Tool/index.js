
/*  /   Modules created by Travis C. J. Gray for personal use in this applicaiton
 * /
 */
const HubSpot_Login = require('./api/logins/hubspot_login.js');
const SalesForce_Login = require('./api/logins/salesforce_login.js');

/*  /   Modules from different NPM/Node.js librarys
 * /    Install with: npm install
 */
const express = require('express');                             //  EX
const bodyParser = require('body-parser');                      //  BP
//const fileUpload = require('express-fileupload');
var fs = require('fs');

const app = express();                                          //  EX

app.use(bodyParser.json());                                     //  BP  ->  support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));             //  BP

app.use( express.static( "assets" ) );
//app.use(fileUpload());

// include css here 
var css_global =  fs.readFileSync('./assets/css/global.css', 'utf8');

//   This is the port that the application will run on
//
const port = 3000;

/*  /   Sets the application to use the view folder, and enable EJS (Embedded JavaScript)
 * /    
 */
app.set('view engine', 'ejs');

/*  /   API calls 
 * /
 */

app.get('/', async (req, res) => {
    var ejs_variables = {};
    ejs_variables.title = "Buff Map Homepage";

    // Assign css from here
    ejs_variables.css = css_global;

    if ( 0 /*isAuthorized(req.sessionID) */) {
        //const accessToken = await getAccessToken(req.sessionID);
        //const contact = await getContact(accessToken);
        //res.write(`<h4>Access token: ${accessToken}</h4>`);
        //displayContactName(res, contact);
        console.log("\nHOMEPAGE\n");
        res.render('homepage', ejs_variables);
    } else {
        //res.write(`<a href="/install"><h3>Install the app</h3></a>`);
        console.log("\nLOGIN\n");
        res.render('login', ejs_variables);
    }
    //res.end();
});
 
//  Homepage 
//  Loads:      ./views/homepage.ejs
//
app.get('/homepage', async (req, res) => {
	var ejs_variables = {};
    ejs_variables.title = "Buff Map";

    // Assign css from here
    ejs_variables.css = css_global;
	
    // Render the ./views/homepage.ejs template usign new ejs object
    if (0 /* isAuthorized(req.sessionID) */) {
        console.log("\nHOMEPAGE\n");
        res.render('homepage', ejs_variables);
    } else {
        console.log("\nLOGIN\n");
        res.render('login', ejs_variables);
    }
})

//  Login 
//  Loads:      ./views/Login.ejs
//
app.get('/login', async (req, res) => {
    var ejs_variables = {};
    ejs_variables.title = "Login";
    
    // Assign css from here
    ejs_variables.css = css_global;

    // Render the ./views/homepage.ejs template usign new ejs object
    res.render('login', ejs_variables);
})

//  Login with CRM Name
//  Loads:      ./views/homepage.ejs
//              ./views/error.ejs
//
app.post('/login/:CRM_Name', async (req, res) => {
    var ejs_variables = {};
    ejs_variables.title = "Login";

    var CRM_Name = req.params.CRM_Name;

    //TODO Login with the right CRM given the CRM NAME
    // if CRM_Name == HubSpot
    //      Login with HubSpot
    // if CRM_Name == SalesForce
    //      Login with SalesForce
    if (CRM_Name == "HubSpot") {
        console.log("HubSpot");
        ejs_variables.crm = "HubSpot";
        // Login in User with Hub Spot OAuth 2.0

        // Login and load the homepage
        try {
            //ejs_variables.contact = await HubSpot_Login.testfuntion();
            ejs_variables.contacts = await HubSpot_Login.OAuth_HubSpot(req.sessionID);
        } catch {
            console.log("Catch");
        }
    }
    else if (CRM_Name == "SalesForce") {
        console.log("Sales Force");
        ejs_variables.crm = "SalesForce";
        // Login in User with Sales Force

        // Login and load the homepage
        try {
            //ejs_variables.contact = await HubSpot_Login.testfuntion();
            ejs_variables.contacts = await HubSpot_Login.OAuth_HubSpot(req.sessionID);
        } catch {
            console.log("Catch");
        }
    }

    // Assign css from here
    ejs_variables.css = css_global;

    // Render the ./views/homepage.ejs template usign new ejs object
    res.render('homepage', ejs_variables);
})

//  Loads:      ./views/homepage.ejs
//
app.get('/search', async (req, res) => {
	var ejs_variables = {};
    ejs_variables.title = "Search";

    // Assign css from here
    ejs_variables.css = css_global;

    // Render the ./views/homepage.ejs template usign new ejs object
	res.render('homepage', ejs_variables);
})

//Run application on a specific port
app.listen(port, () => {
	
	console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
	console.log(`+  Facebook tool application listening on port ${port}!`)
	console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
	console.log("     1. Open Google Chrome Browser                     +");
	console.log("     2. Navigate to: ");
	console.log(`              localhost:${port}/homepage`);
	console.log("+                                                      +");
	console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
});

/*
 * 
 *  CODE Graveyard 
 * 
 */