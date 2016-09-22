var express = require('express');
var api     = express.Router();
var jsonParser = require('body-parser');
var handlers = require( '../bin/handlers' ).handlers;

api.use(jsonParser.urlencoded({ extended: true, inflate: true }));
api.use(jsonParser.json());

// set up the API handlers
api.get   ( '/kulture/:id', handlers.GetKulture );
api.get   ( '/kulture/',    handlers.GetKulture );
api.delete( '/kulture/:id', handlers.DelKulture );
api.delete( '/kulture/',    handlers.DelKulture );
api.post  ( '/kulture/',    handlers.AddKulture );

// temp until can be stored in a proper place
var curr_user;

module.exports = api;
