
require('dotenv').config();
const express = require('express');
const request = require('request-promise-native');
const NodeCache = require('node-cache');
const session = require('express-session');
const opn = require('open');
const app = express();


const refreshTokenStore = {};
const accessTokenCache = new NodeCache({ deleteOnExpire: true });

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    throw new Error('Missing CLIENT_ID or CLIENT_SECRET environment variable.')
}

const port = 3000;
//const IP = "192.168.0.25";
const IP = "localhost";

//===========================================================================//
//  HUBSPOT APP CONFIGURATION
//
//  All the following values must match configuration settings in your app.
//  They will be used to build the OAuth URL, which users visit to begin
//  installing. If they don't match your app's configuration, users will
//  see an error page.

// Replace the following with the values from your app auth config, 
// or set them as environment variables before running.
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Scopes for this app will default to `contacts`
// To request others, set the SCOPE environment variable instead
let SCOPES = ['contacts'];
if (process.env.SCOPE) {
    SCOPES = (process.env.SCOPE.split(/ |, ?|%20/)).join(' ');
}

// On successful install, users will be redirected to /oauth-callback
const REDIRECT_URI = `http://${IP}:${port}/login-hubspot/oauth-callback`;
const INSTALL_URI_HUBSPOT = `http://${IP}:${port}/login-hubspot/install`;

console.log(REDIRECT_URI);

//===========================================================================//

// Use a session to keep track of client ID
app.use(session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true
}));

//================================//
//   Running the OAuth 2.0 Flow   //
//================================//

// Step 1
// Build the authorization URL to redirect a user
// to when they choose to install the app
const authUrl =
    'https://app.hubspot.com/oauth/authorize' +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` + // app's client ID
    `&scope=${encodeURIComponent(SCOPES)}` + // scopes being requested by the app
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`; // where to send the user after the consent page

// Redirect the user from the installation page to
// the authorization URL
app.get('/login-hubspot/install', (req, res) => {
    console.log('');
    console.log('=== Initiating OAuth 2.0 flow with HubSpot ===');
    console.log('');
    console.log("===> Step 1: Redirecting user to your app's OAuth URL");
    res.redirect(authUrl);
    console.log('===> Step 2: User is being prompted for consent by HubSpot');
});

// Step 2
// The user is prompted to give the app access to the requested
// resources. This is all done by HubSpot, so no work is necessary
// on the app's end

// Step 3
// Receive the authorization code from the OAuth 2.0 Server,
// and process it based on the query parameters that are passed
app.get('/login-hubspot/oauth-callback', async (req, res) => {
    console.log('===> Step 3: Handling the request sent by the server');

    // Received a user authorization code, so now combine that with the other
    // required values and exchange both for an access token and a refresh token
    if (req.query.code) {
        console.log('       > Received an authorization token');

        const authCodeProof = {
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: req.query.code
        };

        // Step 4
        // Exchange the authorization code for an access token and refresh token
        console.log('===> Step 4: Exchanging authorization code for an access token and refresh token');
        const token = await exchangeForTokens(req.sessionID, authCodeProof);
        if (token.message) {
            return res.redirect(`/error?msg=${token.message}`);
        }

        // Once the tokens have been retrieved, use them to make a query
        // to the HubSpot API
        res.redirect(`/homepage`);
    }
});

//==========================================//
//   Exchanging Proof for an Access Token   //
//==========================================//

const exchangeForTokens = async (userId, exchangeProof) => {
    try {
        const responseBody = await request.post('https://api.hubapi.com/oauth/v1/token', {
            form: exchangeProof
        });
        // Usually, this token data should be persisted in a database and associated with
        // a user identity.
        const tokens = JSON.parse(responseBody);
        refreshTokenStore[userId] = tokens.refresh_token;
        accessTokenCache.set(userId, tokens.access_token, Math.round(tokens.expires_in * 0.75));

        console.log('       > Received an access token and refresh token');
        return tokens.access_token;
    } catch (e) {
        console.error(`       > Error exchanging ${exchangeProof.grant_type} for access token`);
        return JSON.parse(e.response.body);
    }
};

const refreshAccessToken = async (userId) => {
    const refreshTokenProof = {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        REDIRECT_URI: REDIRECT_URI,
        refresh_token: refreshTokenStore[userId]
    };
    return await exchangeForTokens(userId, refreshTokenProof);
};

const getAccessToken = async (userId) => {
    // If the access token has expired, retrieve
    // a new one using the refresh token
    if (!accessTokenCache.get(userId)) {
        console.log('Refreshing expired access token');
        await refreshAccessToken(userId);
    }
    return accessTokenCache.get(userId);
};

const isAuthorized = (userId) => {
    console.log("\n Trying to OAUTH:\t4 \n");
    return refreshTokenStore[userId] ? true : false;
};

//====================================================//
//   Using an Access Token to Query the HubSpot API   //
//====================================================//

const getContact = async (accessToken) => {
    console.log('');
    console.log('=== Retrieving a contact from HubSpot using the access token ===');
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
        console.log('===> Replace the following request.get() to test other API calls');
        console.log('===> request.get(\'https://api.hubapi.com/contacts/v1/lists/all/contacts/all\')');
        const result = await request.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all', {
            headers: headers
        });

        return JSON.parse(result).contacts;
    } catch (e) {
        console.error('  > Unable to retrieve contact');
        return JSON.parse(e.response.body);
    }
};

const getContactAddress = async (accessToken, Contact) => {
    console.log('');
    console.log('=== Retrieving a contact from HubSpot using the access token ===');
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        var Contact_Url = "https://api.hubapi.com/contacts/v1/contact/vid/" + Contact.vid + "/profile"

        console.log('===> Replace the following request.get() to test other API calls');
        console.log('===> request.get(\'' + Contact_Url + '\')');

        const result = await request.get(Contact_Url, {
            headers: headers
        });

        console.log('===> request finished!!!');

        return JSON.parse(result).properties.address.value;

    } catch (e) {
        console.error('  > Unable to retrieve contact');
        return JSON.parse(e.response.body);
    }
};

app.get('/error', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.write(`<h4>Error: ${req.query.msg}</h4>`);
    res.end();
});



//////////////////////////////
// HUBSPOT FUNTIONS ABOVE
/////////////////////////////

/*  /   Modules created by Travis C. J. Gray for personal use in this applicaiton
 * /
 */
const HubSpot_Login = require('./api/logins/hubspot_login.js');
const SalesForce_Login = require('./api/logins/salesforce_login.js');

/*  /   Modules from different NPM/Node.js librarys
 * /    Install with: npm install
 */
 // -> const express = require('express');                             //  EX
const bodyParser = require('body-parser');                      //  BP
//const fileUpload = require('express-fileupload');
var fs = require('fs');

// -> const app = express();                                          //  EX

app.use(bodyParser.json());                                     //  BP  ->  support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));             //  BP

app.use( express.static( "assets" ) );
//app.use(fileUpload());

// include css here 
var css_global =  fs.readFileSync('./assets/css/global.css', 'utf8');

//   This is the port that the application will run on
//
// -> const port = 3000;

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

    if (isAuthorized(req.sessionID)) {
        //const accessToken = await getAccessToken(req.sessionID);
        //const contact = await getContact(accessToken);
        //res.write(`<h4>Access token: ${accessToken}</h4>`);
        //displayContactName(res, contact);
        console.log("\nHOMEPAGE\n");

        ejs_variables.accessToken = await getAccessToken(req.sessionID);
        ejs_variables.contacts = await getContact(ejs_variables.accessToken);

        var AddressList = [];
        for (let contact in ejs_variables.contacts) {
            AddressList.push(await getContactAddress(ejs_variables.accessToken, ejs_variables.contacts[contact]));
        }
        ejs_variables.addresses = AddressList;

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
    if (isAuthorized(req.sessionID)) {
        console.log("\nHOMEPAGE\n");

        ejs_variables.accessToken = await getAccessToken(req.sessionID);
        ejs_variables.contacts = await getContact(ejs_variables.accessToken);

        var AddressList = [];
        for (let contact in ejs_variables.contacts) {
            AddressList.push(await getContactAddress(ejs_variables.accessToken, ejs_variables.contacts[contact]));
        }
        ejs_variables.addresses = AddressList;
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
	console.log(`              ${IP}:${port}/homepage`);
	console.log("+                                                      +");
	console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
});

/*
 * 
 *  CODE Graveyard 
 * 
 */