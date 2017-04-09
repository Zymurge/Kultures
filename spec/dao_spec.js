let DB = require('../bin/dao');
let mongoDB = require('../bin/mongoDB');
let debug = require('debug')('test:DAO');
let MongoClient = require('mongodb').MongoClient;
let Promise = require( 'promise' );
let _ = require( 'underscore' );

let sinon = require( 'sinon' );
require( 'sinon-as-promised' );

let chai = require( 'chai' );
let chaiAsPromised = require( 'chai-as-promised' );
chai.use(chaiAsPromised);
let expect = chai.expect;
let should = chai.should;

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
	it( "throws on bad url", function( done ) {
		let badUrl = "mangled-db://Imabadurl";
        expect(() => { new mongoDB.DbAccess( badUrl ); } ).to.throw( Error );
		done();
	} );
} );

describe( "With Mongodb running", function() {
	let client;
	let beforeCnt = 1;
	let running = false; // add check for Mongo running
	beforeEach( function() {
		debug( "++++++++\n@beforeEach case #" + beforeCnt++ );
		if( running ) { 
			client = new mongoDB.DbAccess( "mongodb://localhost" );
			MongoClean( testKultureCollection )
				.then( ( result ) => {
					debug( "@beforeEach - MongoClean returned: ", result );
				} );
		} else {
			debug( "No Mongo, should be skipping this section" );
			this.skip();
		};
	} );
		
	describe( "DBAccess ConnectToMongo", function() {
		it( "can connect at localhost", function( done ) {
			client.ConnectToMongo()
				.then( ( db ) => {
					expect( db ).not.to.be.null;
					expect( db.databaseName ).not.to.be.null;
					db.close();
					done();
				} )
				.catch( ( err ) => {
					debug( "ConnectToMongo err: ", err );
					expect( err ).not.to.beTruthy( "should not get here with a connection" );
					done();
				} )
		} );
	} );

	describe( "DBAccess MongoInsertKulture", function() {
		it("inserts a record", function( done ) {
			client.MongoInsertKulture( testKulture )
				.then( ( id ) => {
					debug( "successfully inserted: ", id );
					expect( id ).to.equal( testKulture.ref.id );
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
				.finally( () => { done(); } )
		} );
		it( "returns on error on attempt to insert existing id", function( done ) {
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

	describe( "DBAccess MongoDeleteKulture", function() {
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

	describe( "DBAccess MongoFetchId", function() {
		it( "can fetch the preloaded record" , function( done ) {
			MongoAdd( testKulture )
				.then( () => {
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
				.finally( () => { 
					debug( "...finally!" );
					done(); 
				} );
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

describe( "GetKultureById", function() {
	let db, dao;
	let mfiStub = sinon.stub( mongoDB.DbAccess.prototype, "MongoFetchId" );
	beforeEach( function() {
		db = new mongoDB.DbAccess("mongodb://dummy" );
		dao = new DB.DAO( db );
		expect( dao ).not.to.be.null;
		expect( dao.db ).to.equal( db );
	} );
	it( "fulfills on success", function() {
		mfiStub.returns( Promise.resolve( testKulture ) );
		return dao.GetKultureById( testKulture.ref.id )
			.then( ( kulture ) => {
				debug( "Promise fulfilled with payload: ", kulture );
				expect( kulture ).not.to.be.null;
				expect( kulture ).to.equal( testKulture );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).to.be.null; // force fail
			} ); 
	} );	
	it( "rejects on id not found in collection", function() {
		mfiStub.returns( Promise.resolve( { } ) );
		return dao.GetKultureById( 'homeless id' )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).to.be.null;
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
                ValidateJSONError(error,'GetKultureById','homeless id','id not found');
			} ); 
	} );
    it("gracefully fails null id", function () {
        mfiStub.resetBehavior();
        return dao.GetKultureById(null)
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
           })
            .catch((error) => {
                debug("Caught (expected) error: ", error);
                ValidateJSONError(error, 'GetKultureById', 'none', 'id argument is null');
            });
    });
    it("gracefully fails DB error", function () {
        let err = "MongoDB error code: 999999";
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        mfiStub.rejects(err);
         return dao.GetKultureById('fail')
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                debug( "Caught (expected) error: ", error.message.message );
                expect(error).ok;
                expect(error.message).ok;
                expect(error.message instanceof Error ).to.be.true;
                expect(error.message.message).to.equal( err );
                expect(error.id).to.equal('fail');
            });
    });
} );

describe( "InsertKulture", function() {
	let db, dao;
	let mikStub = sinon.stub( mongoDB.DbAccess.prototype, "MongoInsertKulture" );
	beforeEach( function() {
		db = new mongoDB.DbAccess("mongodb://dummy" );
		dao = new DB.DAO( db );
		expect( dao ).not.to.be.null;
		expect( dao.db ).to.equal( db );
	} );
	it( "fulfills on success", function() {		
		mikStub.returns( Promise.resolve( "this should fail" ) );
		mikStub.returns( Promise.resolve( testKulture.ref.id ) );
		return dao.InsertKulture( testKulture )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( result ).not.to.be.null;
				expect( result ).to.equal( testKulture.ref.id );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).to.be.null; // force fail
			} ); 
	} );
    it("gracefully fails null kulture arg", function () {
        mikStub.resetBehavior();
        return dao.InsertKulture(null)
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                debug("Caught (expected) error: ", error);
                ValidateJSONError(error, 'InsertKulture', 'none', 'kulture argument is null');
            });
    });
    it("gracefully fails DB error", function () {
        let err = "MongoDB error code: 999999";
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        mikStub.rejects(err);
        return dao.InsertKulture( testKulture )
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                debug("Caught (expected) error: ", error.message.message);
                expect(error).ok;
                expect(error.api).ok;
                expect(error.api).to.equal( 'InsertKulture' );
                expect(error.id).ok;
                expect(error.id).to.equal(testKulture.ref.id);
                expect(error.message).ok;
                expect(error.message instanceof Error).to.be.true;
                expect(error.message.message).to.equal(err);
            });
    });

} );

describe( "DeleteKultureById", function() {
    let db, dao;
    let mdkStub = sinon.stub(mongoDB.DbAccess.prototype, "MongoDeleteKulture");
    beforeEach(function () {
        db = new mongoDB.DbAccess("mongodb://dummy");
        dao = new DB.DAO(db);
        expect(dao).not.to.be.null;
        expect(dao.db).to.equal(db);
    });
	it( "fulfills on success", function() {
		mdkStub.resolves( testKulture.ref.id );
		return dao.DeleteKultureById( testKulture.ref.id )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( result ).not.to.be.null;
				expect( result ).to.equal( testKulture.ref.id );
			} )
			.catch( ( error ) => {
				debug( "Caught error: ", error );
				expect( error ).to.be.null; // force fail
			} );
	} );	
	it( "rejects on id not found in collection", function() {
		mdkStub.resolves( { } );
		return dao.DeleteKultureById( 'homeless id' )
			.then( ( result ) => {
				debug( "Promise fulfilled with payload: ", result );
				expect( result ).to.be.null;
			} )
			.catch( ( error ) => {
				debug( "Caught (expected) error: ", error );
                ValidateJSONError(error, 'DeleteKultureById', 'homeless id', "kultureId not found");
			} );
	} );
	it( "gracefully fails null id", function() {
		return dao.DeleteKultureById( null )
			.then( ( result ) => {
				debug( "Promise fulfilled. Not sure why: ", result );
				expect( result ).to.be.null; // force fail
			} )
			.catch( ( error ) => {
                debug("Caught (expected) error: ", error);
                ValidateJSONError(error, 'DeleteKultureById', 'none', "kultureId argument is null");
			} );
	} );
    it("gracefully fails DB error", function () {
        let err = "MongoDB error code: 999999";
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        mdkStub.rejects(err);
        return dao.DeleteKultureById('fail')
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                debug("Caught (expected) error: ", error.message.message);
                expect(error).ok;
                expect(error.message).ok;
                expect(error.message instanceof Error).to.be.true;
                expect(error.message.message).to.equal(err);
                expect(error.id).to.equal('fail');
            });
    });
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
	let myClient = new mongoDB.DbAccess( url );
	myClient.ConnectToMongo = function() {
		debug( "Fake ConnectToMongo called - rejecting" );
		return Promise.reject( { name: "MockClient", code: -1, message: "simulated connection error" } );
	};
	return myClient;
}

let ValidateJSONError = function (error, expectedApi, expectedId, expectedMessage) {
    expect(error, "error object must exist and be populated" ).ok;
    expect(error.api, "error.api must exist and be populated").ok;
    expect(error.api).to.equal(expectedApi);
    expect(error.id, "error.id must exist and be populated" ).ok;
    expect(error.id).to.equal(expectedId);
    expect(error.message, "error.message must exist and be populated").ok;
    expect(error.message).to.equal(expectedMessage);
}
