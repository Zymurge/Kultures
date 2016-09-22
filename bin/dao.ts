"use strict";
import * as MongoClient from "mongodb";
// let MongoClient = require('mongodb').MongoClient;
import * as Promise from "promise";
//let Promise = require( 'promise' );
/*
let _ = require( 'underscore' );
let debugDAO = require( 'debug' )( 'kulture:DAO' );
let debugDbAccess = require( 'debug' )( 'kulture:DbAccess' ); 
*/

function DAO( dbConnection ) {
	debugDAO( "DAO_ctor: ", dbConnection );
	this.db = dbConnection;
}

DAO.prototype = {

	GetKultureById: function( getId ) {
		debugDAO( "GetKultureById received: ", getId );
		let self = this;
		let myClient = null;
		return new Promise( function( fulfill, reject ) {
			if( getId === null ) { 
				debugDAO( "null param is no bueno" );
				reject( { id: 'none', message: 'id argument is null'  } );
			}
			debugDAO( ":: self.db= ", self.db );
			self.db.MongoFetchId( getId )
				.then( ( result ) => {
					debugDAO( "..FetchId return: ", result );
					if( _.isEmpty( result ) ) {
						debugDAO( "....empty set = fail" );
						reject( { id: getId, message: "id not found" } );
					} else {
						fulfill( result );
					};
				} )
				.catch( ( err ) => { 
					reject( err );
				} );
		} );
	},

	InsertKulture: function ( kulture ) {
		let self = this;
		debugDAO( ".. InsertKulture received:" + JSON.stringify( kulture ) );
		return new Promise( function( fulfill, reject ) {
			if( kulture === null ) {
				debugDAO( "null param is no bueno" );
				reject( { id: 'none', message: 'kulture argument is null' } );
			}
			self.db.MongoInsertKulture( kulture )
				.then( ( result ) => {
					debugDAO( ".... insert result: " + JSON.stringify( result ) );
			        fulfill( result );
				} )
				.catch( ( err ) => { 
					reject( err );
				} );
		} );	
	},

	DeleteKultureById: function( kultureId ) {
		debugDAO( "GetKultureById received: ", kultureId );
		let self = this;
		let myClient = null;
		return new Promise( function( fulfill, reject ) {
			if( kultureId === null ) { 
				debugDAO( "null param is no bueno" );
				reject( { id: 'none', message: 'id argument is null'  } );
			}
			debugDAO( ":: self.db= ", self.db );
			self.db.MongoDeleteKulture( kultureId )
				.then( ( result ) => {
					debugDAO( "..DeleteId return: ", result );
					if( _.isEmpty( result ) ) {
						debugDAO( "....empty set = fail" );
						reject( { id: kultureId, message: "id not found" } );
					} else {
						fulfill( result );
					};
				} )
				.catch( ( err ) => { 
					reject( err );
				} );
		} );
	},

}

function DbAccess( url, timeOut ) {
	if( ! url.startsWith( "mongodb://" ) ) {
		throw new Error( "Not a mongodb url: ", url );
	}
	// trim off any trailing / from the url (will add it back with options string)
	this.mongoUrl = ( url.endsWith( '/') ) ? url.substring( 0, url.length - 1) : url;
	if( timeOut === undefined ) {
		timeOut = 4000; // default
	}
	this.connectStr = this.mongoUrl + "/?connectTimeoutMS=" + timeOut;
	this.connection = null;
	debugDbAccess( "DbAccess_ctor url: ", this.mongoUrl, "connectStr: ", this.connectStr );
}

DbAccess.prototype = {

	ConnectToMongo: function() {
		let self = this;
		return new Promise( function( fulfill, reject ) {
			debugDbAccess( "Attempting to connect to ", self.connectStr );
			MongoClient.connect( self.connectStr, function( err, db ) {
				if( err ) { 
					debugDbAccess( "Error rcvd: ", err );
					reject( err );
				} else {
					debugDbAccess( "Connected to mongo" );
					self.connection = db;
					fulfill( db );		
				}
			} );
		} );
	},

	GetCollection: function( collName ) {
		let self = this;
		return new Promise( function( fulfill, reject ) {
			self.ConnectToMongo()
				.then( self.connection.collection( colName ) )
				.then( function( myCollection ) {
					debugDbAccess( "rcvd collection: ", myCollection );
					fulfill( myCollection );
				} )
				.catch( function( err ) {
					debugDbAccess( "err: ", err );
					reject( err );
				} );
		} );
	},

	MongoFetchId: function( id ) {
		let self = this;
		debugDbAccess( "MongoFetchId: ", id );
		return new Promise( function( fulfill, reject ) {
			self.ConnectToMongo()
				.then( ( connection ) => {
					kultureCollection = self.connection.collection( 'kultures' );
					return kultureCollection.find( { 'ref.id': id } ).limit(1).next();
				} )
				.then( ( kulture ) => {
					debugDbAccess( ".. found: ", kulture );
					fulfill( kulture !== null ? kulture : { } );
				} )
				.catch( ( err ) => {
					debugDbAccess( "mongo fetch error: ", err );
					reject( err );
				} );
			} );
	},

	MongoInsertKulture: function( kulture ) {
		let self = this;
		debugDbAccess( "MongoInsertKulture: ", kulture.ref.id );
		return new Promise( function( fulfill, reject ) {
			self.ConnectToMongo()
				.then( ( connection ) => {
					kultureCollection = self.connection.collection( 'kultures' );
					return kultureCollection.insertOne( kulture );
				} )
				.then( ( result ) => {
					debugDbAccess( ".. insert count: ", result.insertedCount );
					fulfill( kulture.ref.id );
				} )
				.catch( ( err ) => {
					debugDbAccess( "mongo insert error: ", err );
					reject( err );
				} );
		} );
	},

	MongoDeleteKulture: function( kultureId ) {
		let self = this;
		debugDbAccess( "MongoDeleteKulture ID: ", kultureId );
		return new Promise( function( fulfill, reject ) {
			self.ConnectToMongo()
				.then( ( connection ) => {
					kultureCollection = self.connection.collection( 'kultures' );
					return kultureCollection.removeWhere( { 'ref.id': kultureId } );
				} )

				// TODO: Lookup remove syntax and return info
				.then( ( result ) => {
					debugDbAccess( ".. delete count: ", result.deletedCount ); 
					fulfill( kultureId );
				} )
				.catch( ( err ) => {
					debugDbAccess( "mongo delete error: ", err );
					reject( err );
				} );
		} );
	}

}

module.exports = { DAO, DbAccess };