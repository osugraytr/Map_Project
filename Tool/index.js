
/*  /   Modules created by Travis C. J. Gray for personal use in this applicaiton
 * /
 */
//const Search_FaceBook = require('./api/Search_FaceBook.js');

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
 
//  Homepage 
//  Loads:      ./views/homepage.ejs
//
app.get('/homepage', async (req, res) => {
	var ejs_variables = {};
    ejs_variables.title = "Buff Map";

    // Assign css from here
    ejs_variables.css = css_global;
	
    // Render the ./views/homepage.ejs template usign new ejs object
	res.render('homepage', ejs_variables);
})

//  Loads:      ./views/homepage.ejs
//
app.get('/search', async (req, res) => {
	var ejs_variables = {};
    ejs_variables.title = "Buff Map";

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