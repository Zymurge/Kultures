var config = require('config');
var daoLib = config.get('DAO.lib');
var DB = require( './dao' );
var ValidateThis = require('./kulture_data').ValidateThis;
var Promise = require( 'promise' );

//var extract = require( './DBAccess' ).Extract;
var debug = require('debug')('kulture:handlers');

var Handlers = {

    dao: null,

    get DAO() {
        debug( ":: get DAO: ", this.dao );
        return this.dao;
    }, 

    set DAO( connectStr ) {
        this.dao = new DB.DAO( new DB.DbAccess( connectStr ) );
        debug( ":: set DAO: ", connectStr, " returns: ", this.dao );
        return this.dao;
    },

    GetKulture: function( req, res ) {
        if( ! req.params.id ) {
            debug( ":::: Handlers.GetKulture with no id, Error" );
            return res.type('json').status(400)
                .json( GenerateErrorBody( 'none', 'GetKulture', 'URI did not include id' ) );         
        }
        
        debug( ":::: Handlers.GetKulture for kultureId:", req.params.id );
        debug( ":::: :: DAO object: ", Handlers.DAO );
        Handlers.DAO.GetKultureById( req.params.id )
            .then( ( body ) => {
                debug( "--> In promise resolve - status = " + 200 );
                return Promise.resolve( { code: 200, payload: body } );
            } )
            .then( null, ( error ) => {
                debug( "--> In promise fail - status = " + 404 );
                debug( "--> error: ", error )
                var payload = GenerateErrorBody( req.params.id, 'GetKulture', error );
                return Promise.resolve( { code: 404, payload: payload } );
            } )
            .done( ( result ) => {
               debug( "--> In send handler - status = " + result.code + "\n- body = " + JSON.stringify( result.payload ) );
               res.type('json').status( result.code ).json( result.payload );
         } ); 
    },
/*
    old_GetKulture: function( req, res ) {
        if( ! req.params.id ) {
            debug( ":::: Handlers.GetKulture with no id, Error" );
            return res.type('json').status(400)
                .json( GenerateErrorBody( 'none', 'GetKulture', 'URI did not include id' ) );         
        }
        
        debug( ":::: Handlers.GetKulture for kultureId:", req.params.id );
        var response = DAO.GetKultureById( req.params.id );
        debug( "--> sending response:" );
        debug( "----> statusCode = " + response.status );
        debug( response );
        res.type('json').status( response.status ).json( response.body );
    },
*/

    AddKulture: function( req, res ) {
        debug( ":::: Handlers.AddKulture" )
        if( ! req.body || Object.keys(req.body).length < 1 ) {
            debug( ":::: Handlers.AddKulture with no JSON body, Error" );
            return res.status(400).json( {
                error: {
                    id: 'none',
                    api: 'AddKulture',
                    message: 'POST request missing JSON body'
                } 
            });
        } 
        debug( "--> received kulture request:" );
        debug( req.body );

        var kValid = ValidateThis( req.body );
        if( ! kValid ) {
            debug( ":::: Handlers.AddKulture with improper JSON body, Error" );
            debug( kValid );
            return res.status(400).json( {
                error: {
                    id: 'none',
                    api: 'AddKulture',
                    message: 'POST request JSON body not a valid kulture'
                } 
            });
        } 

        var response = DAO.InsertKulture( req.body );
        debug( "--> sending response:" );
        debug( response );
        res.type('json').status( response.status ).json( response.body );
    },

    DelKulture: function( req, res ) {
        debug( ":::: Handlers.DelPoint" );
        if( ! req.params.id ) {
            debug( ":::: Handlers.DeleteKulture with no id, Error" );
            return res.type('json').status(400).json( {
                error: {
                    id: 'none',
                    api: 'DeleteKulture',
                    message: 'URI did not include id'
                } 
            });         
        }

        debug( ":::: Handlers.DeleteKulture for kultureId:", req.params.id );
        var response = DAO.DeleteKultureById( req.params.id );
        debug( "--> sending response:" );
        debug( "----> statusCode = " + response.status );
        debug( response );
        res.type('json').status( response.status ).json( response.body );
    }
}

exports.handlers = Handlers;

var GenerateErrorBody = function( id, api, message ) {

    return { error: 
                {
                    id: id,
                    api: api,
                    message: message
                } 
    };
}

