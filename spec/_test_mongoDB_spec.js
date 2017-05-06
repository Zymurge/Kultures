let DB = require('../bin/dao');
let mongoDB = require('../bin/mongoDB');
let debug = require('debug')('test:DbAccess');
let MongoClient = require('mongodb').MongoClient;
let Promise = require( 'promise' );
let _ = require( 'underscore' );

//let sinon = require( 'sinon' );
//require( 'sinon-as-promised' );

let chai = require( 'chai' );
let chaiAsPromised = require( 'chai-as-promised' );
chai.use(chaiAsPromised);
let expect = chai.expect;
let should = chai.should;

let testMongoUrl = "mongodb://127.0.0.1";
let testKultureCollection = "kultures"; 
let testKulture = {
    ref: {
      id: '13',
      name: 'test kulture'
    },
    display: {
      loc: {
        x: 1,
        y: 2,
        z: 3
      },
      image: 'none'
    },
    attributes: {
      growth: {},
      invade: {},
      defense: {}
    },
    status: {
      energy: 100,
      health: 200
    }
 };


describe( "DbAccess constructor", function() {
	it( "creates values properly with default timeout", function( done ) {
        let db = new mongoDB.DbAccess( testMongoUrl );
		expect( db ).not.to.be.null;
		expect( db.mongoUrl ).to.equal( testMongoUrl );
		expect( db.connection ).to.be.null;
		expect( db.connectStr ).to.equal( testMongoUrl + "/?connectTimeoutMS=4000" );
		done();
	} );
	it( "creates values properly with explicit timeout", function( done ) {
        let db = new mongoDB.DbAccess( testMongoUrl, 50000 );
		expect( db ).not.to.be.null;
		expect( db.connectStr ).to.equal( testMongoUrl + "/?connectTimeoutMS=50000" );
		done();
	} );
	it( "handles url with post-pended /", function( done ) {
		let pp_url = "mongodb://post-pended_url/";
		let pp_url_fixed = "mongodb://post-pended_url";
        let db = new mongoDB.DbAccess( pp_url );
		expect( db ).not.to.be.null;
		expect( db.mongoUrl ).to.equal( pp_url_fixed );
		expect( db.connectStr ).to.equal( pp_url + "?connectTimeoutMS=4000" );
		done();
	} )
	it("rejects url that isn't prepended with the 'mongodb://' protocol string", function (done) {
		let bad_prefix_url = "wrongproto.url";
		expect(() => { new mongoDB.DbAccess(bad_prefix_url); }).to.throw(Error);
		done();
	} );
} );

describe( "With Mongodb running", function() {
	let client;
	let beforeCnt = 1;
	let running = true; // add check for Mongo running
	beforeEach( function() {
		debug( "++++++++\n@beforeEach case #" + beforeCnt++ );
		if( running ) { 
			client = new mongoDB.DbAccess( testMongoUrl );
			return MongoClean( testKultureCollection )
				.then( ( result ) => {
					debug( "@beforeEach - MongoClean returned: ", result );
				} )
				.catch( ( err ) => {
					debug( "@beforeEach - MongoClean fail: ", err );
					expect( err ).not.ok( "Unable to clean MongoDB" );
				} );
		} else {
			debug( "No Mongo, should be skipping this section" );
			this.skip( "MongoDB is not running" );
		};
	} );
		
	describe( "DbAccess ConnectToMongo", function() {
        it( "can connect at localhost", function() {
			return client.ConnectToMongo()
                .then((db) => {
                    debug("ConnectToMongo success: ", db.s.databaseName);
					expect( db ).not.to.be.null;
					expect( db.databaseName ).not.to.be.null;
					db.close();
				} )
				.catch( ( err ) => {
					debug( "ConnectToMongo err: ", err );
					expect( err ).not.ok( "should not get here with a connection" );
				} )
		} );
	} );

	describe( "DbAccess MongoInsertKulture", function() {
        it("inserts a record", function () {
			return client.MongoInsertKulture( testKulture )
				.then( ( id ) => {
					debug( "MongoInsertKulture successfully inserted: " );
					expect( id, "Return value should be kulture ID" ).to.equal( testKulture.ref.id );
					return client.MongoFetchId( testKulture.ref.id );
				} )
				.then( ( kulture ) => {
					debug( "successfully fetched: ", kulture );
					expect( kulture ).not.to.be.null;
					expect( kulture.ref.id ).to.equal( testKulture.ref.id );
				} )
				.catch( ( error ) => {
					debug( "Caught error: ", error );
					expect( error ).to.be.null; // force fail
				} ) 
        });
        it("returns on error on attempt to insert existing id", function (done) {
			client.MongoInsertKulture( testKulture )
				.then( ( id ) => {
					debug( "successfully inserted: ", id );
					expect( id ).to.equal( testKulture.ref.id );
					// if successful try the same insert again
					return client.MongoInsertKulture( testKulture );
				} )
				.then( ( kulture ) => {
					debug( "success when error expected on duplicate insert" );
					expect( result ).to.be.null; // force fail				
				})
				.catch( ( error ) => {
					debug( "Caught (expected) error: ", error );
					expect( error ).not.to.be.null;
					expect( error ).to.equal( 'duplicate id' );
				} )
				.finally( () => { done(); } )
		} );
		it("handles mongo connection errors on insert", function( done ) {
			let mockClient = GetConnectErrorClient( "mongodb://it.dont.matter" );
			mockClient.MongoInsertKulture( testKulture )
				.then( ( result ) => {
					debug( "Promise fulfilled. Not sure why: ", result );
					expect( result ).to.be.null; // force fail
					done();
				} )
				.catch( ( error ) => {
					debug( "Caught (expected) error: ", error );
					expect( error ).not.to.be.null;
					expect( error ).to.equal( "MongoDb error code: -1" );
					done();
				} );
		} );
	} );

	describe( "DbAccess MongoDeleteKulture", function() {
		it( "can delete the preloaded record" , function( done ) {
			MongoAdd( testKulture )
				.then( () => {
					return client.MongoDeleteKulture( testKulture.ref.id ); 
				} )
				.then( ( id ) => {
					debug( "successfully deleted: ", testKulture.ref.id );
					expect( id ).not.to.be.null;
					expect( id).to.equal( testKulture.ref.id );
				} )
				.catch( ( error ) => {
					debug( "Caught error: ", error );
					expect( error ).to.be.null; // force fail
				} )
				.finally( () => { 
					debug( "...finally!" );
					done(); 
				} );
		} );	

		it("handles mongo connection errors on delete", function( done ) {
			let mockClient = GetConnectErrorClient( "mongodb://it.dont.matter" );
			mockClient.MongoDeleteKulture( "dummy ID" )
				.then( ( result ) => {
					debug( "Promise fulfilled. Not sure why: ", result );
					expect( result ).to.be.null; // force fail
					done();
				} )
				.catch( ( error ) => {
					debug( "Caught (expected) error: ", error );
					expect( error ).not.to.be.null;
					expect( error ).to.equal( "MongoDb error code: -1" );
					done();
				} );
		} );
	} );

	describe( "DbAccess MongoFetchId", function() {
		it( "can fetch the preloaded record" , function() {
			return MongoAdd( testKulture )
				.then( () => {
					debug( "MongoFetchId: successfully added test record");
					debug( "MongoFetchId: calling client: ", client );
					let result =  client.MongoFetchId( testKulture.ref.id ); 
					debug( "MongoFetchId: result: ", result );
					return result;
				} )
				.then( ( kulture ) => {
					debug( "MongoFetchId: successfully fetched: ", kulture );
					expect( kulture ).not.to.be.null;
					expect( kulture.ref.id ).to.equal( testKulture.ref.id );
				} )
				.catch( ( error ) => {
					debug( "MongoFetchId: Caught error: ", error );
					expect( error, "unexpected error" ).to.be.null; // force fail
/*				} )
				.finally( () => { 
					debug( "...finally!" );
					done(); 
*/				} );
		} );	
		it("handles a missing record", function( done ) {
			client.MongoFetchId( '0' )
				.then( ( kulture ) => {
					debug( "successfully fetched: ", kulture );
					expect( kulture ).not.to.be.null;
					expect( _.isEmpty( kulture ) ).to.equal( true );
				} )
				.catch( ( error ) => {
					debug( "Caught error: ", error );
					expect( error ).to.be.null; // force fail
				} )
				.finally( () => { done(); } )
		} );
		it("handles mongo connection errors on fetch", function( done ) {
			let mockClient = GetConnectErrorClient( "mongodb://it.dont.matter" );
			mockClient.MongoFetchId( "dummy ID" )
				.then( ( result ) => {
					debug( "Promise fulfilled. Not sure why: ", result );
					expect( result ).to.be.null; // force fail
					done();
				} )
				.catch( ( error ) => {
					debug( "Caught (expected) error: ", error );
					expect( error ).not.to.be.null;
					expect( error ).to.equal( "MongoDb error code: -1" );
					done();
				} );
		} );
	} );
} );

/***** Helper functions *****/

let debugUtil = require('debug')("test:util");
let MongoClean = function( collection ) {
	return new Promise( function ( fulfill, reject ) {
		MongoClient.connect( testMongoUrl, function( err, db ) {
			if( err ) { 
				debugUtil( "MongoClean: Couldn't connect to mongo", err );
				reject( "MongoClean error:" + err );
			} else {
				debugUtil( "MongoClean: Connected to mongo" );

				// insert test kulture here	
				let dropMe = db.collection( collection );
				debugUtil( "MongoClean: collection:", collection, "is", typeof dropMe );
				if ( dropMe ) {
					dropMe.drop()
						.then( () => {
							debugUtil( "MongoClean: deleted collection", collection );
							fulfill( "deleted collection" );
						} )
						.catch( ( err ) => {
							debugUtil( "MongoClean: Couldn't drop collection. It's likely already gone." );
							fulfill( "deleted collection failed, already missing?" );
						} )
				} else {
					debugUtil( "MongoClean: no collection:", collection, "consider it dropped" );
					fulfill( "collection missing" );
				};
				db.close();
			}
		} );
	} );
}

let MongoAdd = function( kulture ) {
	return new Promise( function( fulfill, reject ) {
		MongoClient.connect( testMongoUrl, function( err, db ) {
			if( err ) { 
				debugUtil( "MongoAdd: Couldn't connect to mongo ", err );
				reject(  "MongoAdd error: " + err  );
			} else {
				debugUtil( "MongoAdd: Connected to mongo" );
				// insert test kulture here	
				debugUtil( "MongoAdd: inserted test record" );
				db.collection( testKultureCollection ).insertOne( kulture );
				debugUtil( "MongoAdd: closing mongo connection" );
				db.close();
				fulfill( true );
			};
		} );
	} );
}

let BuildKultureJSON = function( x, y, z ) {
	let id = x + '.' + y + '.' + z;
	let name = 'I am ' + id;
	let json = 	{
		ref: {
			id: id,
			name: name
		},
		display: {
			loc: {
				x: x,
				y: y,
				z: z
			},
			image: 'unknown'
		},
		attributes: {
			growth: {},
			invade: {},
			defense: {},
		},
		status: {
			energy: 100,
			health: 200
		}
	}
	return json;
}

let GetConnectErrorClient = function( url ) {
	let myClient = new mongoDB.DbAccess( url );
	myClient.ConnectToMongo = function() {
		debug( "Fake ConnectToMongo called - rejecting" );
		return Promise.reject( { name: "MockClient", code: -1, message: "simulated connection error" } );
	};
	return myClient;
}

let ValidateJSONError = function (error, expectedApi, expectedId, expectedMessage) {
    debug("ValidateJSONError for: ", error);
    expect(error, "error object must exist and be populated" ).ok;
    expect(error.api, "error.api must exist and be populated").ok;
    expect(error.api).to.equal(expectedApi);
    expect(error.id, "error.id must exist and be populated" ).ok;
    expect(error.id).to.equal(expectedId);
    expect(error.message, "error.message must exist and be populated").ok;
    expect(error.message).to.equal(expectedMessage);
}
