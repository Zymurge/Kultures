let DB = require( '../bin/dao' );
let debug = require('debug')('test:DAO');
let MongoClient = require('mongodb').MongoClient;
let Promise = require( 'promise' );
let _ = require( 'underscore' );

let testMongoUrl = "mongodb://localhost";
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
		let db = new DB.DbAccess( testMongoUrl );
		expect( db ).toBeTruthy();
		expect( db.mongoUrl ).toBe( testMongoUrl );
		expect( db.connection ).toBeNull();
		expect( db.connectStr ).toBe( testMongoUrl + "/?connectTimeoutMS=4000" );
		done();
	} );
	it( "creates values properly with explicit timeout", function( done ) {
		let db = new DB.DbAccess( testMongoUrl, 50000 );
		expect( db ).toBeTruthy();
		expect( db.connectStr ).toBe( testMongoUrl + "/?connectTimeoutMS=50000" );
		done();
	} );
	it( "handles url with post-pended /", function( done ) {
		let pp_url = "mongodb://post-pended_url/";
		let pp_url_fixed = "mongodb://post-pended_url";
		let db = new DB.DbAccess( pp_url );
		expect( db ).toBeTruthy();
		expect( db.mongoUrl ).toBe( pp_url_fixed );
		expect( db.connectStr ).toBe( pp_url + "?connectTimeoutMS=4000" );
		done();
	} )
	it( "throws on bad url", function( done ) {
		let badUrl = "mangled-db://Imabadurl";
		expect( () => { new DB.DbAccess( badUrl ); } ).toThrow();
		done();
	} );
} );

describe( "With Mongodb running, DBAccess ConnectToMongo", function() {
	let client;
	let beforeCnt = 1;
	beforeEach( function() {
		debug( "++++++++\n@beforeEach case #" + beforeCnt++ );
		client = new DB.DbAccess( "mongodb://localhost" );
		MongoClean( testKultureCollection )
			.then( ( result ) => {
				debug( "@beforeEach - MongoClean returned: ", result );
			});
	} );
	it( "can connect at localhost", function( done ) {
		client.ConnectToMongo()
			.then( ( db ) => {
				expect( db ).toBeTruthy();
				expect( db.databaseName ).not.toBeNull();
				db.close();
				done();
			} )
			.catch( ( err ) => {
				debug( "ConnectToMongo err: ", err );
				expect( err ).not.toBeTruthy( "should not get here with a connection" );
				done();
			} )
	} );
} );

describe( "With Mongodb running, DBAccess MongoInsertKulture", function() {
	let client;
	let beforeCnt = 1;
	beforeEach( function() {
		debug( "++++++++\n@beforeEach case #" + beforeCnt++ );
		client = new DB.DbAccess( "mongodb://localhost" );
		MongoClean( testKultureCollection )
			.then( ( result ) => {
				debug( "@beforeEach - MongoClean returned: ", result );
			});
	} );
	it("inserts a record", function( done ) {
		client.MongoInsertKulture( testKulture )
			.then( ( id ) => {
				debug( "successfully inserted: ", id );
				expect( id ).toBe( testKulture.ref.id );
				return client.MongoFetchId( testKulture.ref.id );
			} )
			.then( ( kulture ) => {
				debug( "successfully fetched: ", kulture );
				expect( kulture ).toBeTruthy();
				expect( kulture.ref.id ).toBe( testKulture.ref.id );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
			} )
			.finally( () => { done(); } )
	} );
	it( "returns on error on attempt to insert existing id", function( done ) {
			done( expect( "Not implemented" ).toBe( false ) );
	} );
	it("handles mongo connection errors on insert", function( done ) {
		let mockClient = GetConnectErrorClient( "mongodb://it.dont.matter" );
		mockClient.MongoInsertKulture( testKulture )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error ).toBe( 'simulated connection error' );
				done();
			} );
	} );
} );

describe( "With Mongodb running, DBAccess MongoDeleteKulture", function() {
	let client;
	let beforeCnt = 1;
	beforeEach( function() {
		debug( "++++++++\n@beforeEach case #" + beforeCnt++ );
		client = new DB.DbAccess( "mongodb://localhost" );
		MongoClean( testKultureCollection )
			.then( ( result ) => {
				debug( "@beforeEach - MongoClean returned: ", result );
			});
	} );
	it( "can delete the preloaded record" , function( done ) {
		MongoAdd( testKulture )
			.then( () => {
				return client.MongoDeleteKulture( testKulture.ref.id ); 
			} )
			.then( ( id ) => {
				debug( "successfully deleted: ", testKulture.ref.id );
				expect( id ).toBeTruthy();
				expect( id).toBe( testKulture.ref.id );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
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
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error ).toBe( 'simulated connection error' );
				done();
			} );
	} );
} );

describe( "With Mongodb running, DBAccess MongoFetchId", function() {
	let client;
	let beforeCnt = 1;
	beforeEach( function() {
		debug( "++++++++\n@beforeEach case #" + beforeCnt++ );
		client = new DB.DbAccess( "mongodb://localhost" );
		MongoClean( testKultureCollection )
			.then( ( result ) => {
				debug( "@beforeEach - MongoClean returned: ", result );
			});
	} );
	it( "can fetch the preloaded record" , function( done ) {
		MongoAdd( testKulture )
			.then( () => {
				return client.MongoFetchId( testKulture.ref.id ); 
			} )
			.then( ( kulture ) => {
				debug( "successfully fetched: ", kulture );
				expect( kulture ).toBeTruthy();
				expect( kulture.ref.id ).toBe( testKulture.ref.id );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
			} )
			.finally( () => { 
				debug( "...finally!" );
				done(); 
			} );
	} );	
	it("handles a missing record", function( done ) {
		client.MongoFetchId( '0' )
			.then( ( kulture ) => {
				debug( "successfully fetched: ", kulture );
				expect( kulture ).toBeTruthy();
				expect( _.isEmpty( kulture ) ).toBe( true );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
			} )
			.finally( () => { done(); } )
	} );
	it("handles mongo connection errors on fetch", function( done ) {
		let mockClient = GetConnectErrorClient( "mongodb://it.dont.matter" );
		mockClient.MongoFetchId( "dummy ID" )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error ).toBe( 'simulated connection error' );
				done();
			} );
	} );
} );

describe( "GetKultureById", function() {
	let db, dao;
	beforeEach( function() {
		db = new DB.DbAccess("mongodb://dummy" );
		dao = new DB.DAO( db );
		expect( dao ).toBeTruthy();
		expect( dao.db ).toBe( db );
	} );
	it( "fulfills on success", function(done) {
		spyOn( DB.DbAccess.prototype, "MongoFetchId" ).andReturn( Promise.resolve( testKulture ) );
		dao.GetKultureById( testKulture.ref.id )
			.then( ( kulture ) => {
				debug( "Promise fulfilled with payload: ", kulture );
				expect( kulture ).toBeTruthy();
				expect( kulture ).toBe( testKulture );
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
				done();
			} );
	} );	
	it( "rejects on id not found in collection", function(done) {
		spyOn( DB.DbAccess.prototype, "MongoFetchId" ).andReturn( Promise.resolve( { } ) );
		dao.GetKultureById( 'homeless id' )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( result ).toBeNull();
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error.message ).toBe( 'id not found' );
				expect( error.id ).toBe( 'homeless id' );
				done();
			} );
	} );
	it( "gracefully fails null id", function(done) {
		//spyOn( DB.DbAccess.prototype, "MongoFetchId" ).andReturn( Promise.reject( "null id" ) );
		dao.GetKultureById( null )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error.message ).toBe( 'id argument is null' );
				expect( error.id ).toBe( 'none' );
				done();
			} );
	} );
} );

describe( "InsertKulture", function() {
	let db, dao;
	beforeEach( function() {
		db = new DB.DbAccess("mongodb://dummy" );
		dao = new DB.DAO( db );
		expect( dao ).toBeTruthy();
		expect( dao.db ).toBe( db );
	} );
	it( "fulfills on success", function(done) {
		spyOn( DB.DbAccess.prototype, "MongoInsertKulture" ).andCallFake( ( kulture ) => {
			return Promise.resolve( kulture.ref.id );
		} );
		dao.InsertKulture( testKulture )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( DB.DbAccess.prototype.MongoInsertKulture ).toHaveBeenCalled();
				expect( result ).toBeTruthy();
				expect( result ).toBe( testKulture.ref.id );
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
				done();
			} );
	} );
	it( "informs of insert failure", function(done) {
		spyOn( DB.DbAccess.prototype, "MongoInsertKulture" ).andCallFake( ( kulture ) => {
			let err = { id: kulture.ref.id, message: "insert failure" };
			return Promise.reject( err );
		} );
		dao.InsertKulture( testKulture )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				expect( error ).toBeTruthy();
				debug( "Caught (expected) error: ", error );
				expect( error.message ).toBe( 'insert failure' );
				expect( error.id ).toBe( testKulture.ref.id );
				done();
			} );
	} );
	it( "gracefully fails null kulture", function(done) {
		dao.InsertKulture( null )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				expect( error ).toBeTruthy();
				debug( "Caught (expected) error: ", error );
				expect( error.message ).toBe( 'kulture argument is null' );
				expect( error.id ).toBe( 'none' );
				done();
			} );
	} );
} );

describe( "DeleteKultureById", function() {
	let db, dao;
	beforeEach( function() {
		db = new DB.DbAccess("mongodb://dummy" );
		dao = new DB.DAO( db );
		expect( dao ).toBeTruthy();
		expect( dao.db ).toBe( db );
	} );
	it( "fulfills on success", function(done) {
		spyOn( DB.DbAccess.prototype, "MongoDeleteKulture" ).andReturn( Promise.resolve( testKulture.ref.id ) );
		dao.DeleteKultureById( testKulture.ref.id )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( DB.DbAccess.prototype.MongoDeleteKulture ).toHaveBeenCalled();
				expect( result ).toBeTruthy();
				expect( result ).toBe( testKulture.ref.id );
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).toBeNull(); // force fail
				done();
			} );
	} );	
	it( "rejects on id not found in collection", function(done) {
		spyOn( DB.DbAccess.prototype, "MongoDeleteKulture" ).andReturn( Promise.resolve( { } ) );
		dao.DeleteKultureById( 'homeless id' )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( result ).toBeNull();
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error.message ).toBe( 'id not found' );
				expect( error.id ).toBe( 'homeless id' );
				done();
			} );
	} );
	it( "gracefully fails null id", function(done) {
		dao.DeleteKultureById( null )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).toBeNull(); // force fail
				done();
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
				expect( error ).toBeTruthy();
				expect( error.message ).toBe( 'id argument is null' );
				expect( error.id ).toBe( 'none' );
				done();
			} );
	} );
} );

/***** Helper functions *****/

let MongoClean = function( collection ) {
	return new Promise( function ( fulfill, reject ) {
		MongoClient.connect( testMongoUrl, function( err, db ) {
			if( err ) { 
				debug( "MongoClean: Couldn't connect to mongo", err );
				reject( "MongoClean error:" + err );
			} else {
				debug( "MongoClean: Connected to mongo" );
				// insert test kulture here	
				let dropMe = db.collection( collection );
				debug( "MongoClean: collection:", collection, "is", typeof dropMe );
				if ( dropMe ) {
					dropMe.drop()
						.then( () => {
							debug( "MongoClean: deleted collection", collection );
							fulfill( "deleted collection" );
						} )
						.catch( ( err ) => {
							debug( "MongoClean: Couldn't drop collection. It's likely already gone." );							fulfill( "deleted collection" );
							fulfill( "deleted collection failed, already missing?" );
						} )
				} else {
					debug( "MongoClean: no collection:", collection, "consider it dropped" );
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
				debug( "MongoAdd: Couldn't connect to mongo ", err );
				reject(  "MongoAdd error: " + err  );
			} else {
				debug( "MongoAdd: Connected to mongo" );
				// insert test kulture here	
				debug( "MongoAdd: inserted test record" );
				db.collection( testKultureCollection ).insertOne( kulture );
				fulfill( true );
				db.close();
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
	let myClient = new DB.DbAccess( url );
	myClient.ConnectToMongo = function() {
		debug( "Fake ConnectToMongo called - rejecting" );
		return Promise.reject( "simulated connection error" );
	};
	return myClient;
}
