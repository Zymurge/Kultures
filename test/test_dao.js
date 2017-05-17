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
	it( "throws on bad url", function( done ) {
		let badUrl = "mangled-db://Imabadurl";
        expect(() => { new mongoDB.DbAccess( badUrl ); } ).to.throw( Error );
		done();
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
        let errMsg = "MongoDB error code: 999999";
        mfiStub.rejects(errMsg);
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
         return dao.GetKultureById('fail')
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                // Unwrap here
                error.message = error.message.message;
                debug("Caught (expected) error: ", error.message);
                ValidateJSONError(error, 'GetKultureById', 'fail', errMsg);
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
    it("handles and notifies on duplicate ID", function () {
        let errMsg = "duplicate id";
        mikStub.rejects(errMsg);
        return dao.InsertKulture(testKulture)
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                error.message = error.message.message;
                debug("Caught (expected) error: ", error.message);
                ValidateJSONError(error, 'InsertKulture', testKulture.ref.id, errMsg);
            });
    });
    it("gracefully fails DB error", function () {
        let errMsg = "MongoDB error code: 999999";
        mikStub.rejects(errMsg);
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        return dao.InsertKulture( testKulture )
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                // Unwrap here
                error.message = error.message.message;
                debug("Caught (expected) error: ", error.message);
                ValidateJSONError(error, 'InsertKulture', '13', errMsg );
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
        let errMsg = "MongoDB error code: 999999";
        mdkStub.rejects(errMsg);
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        return dao.DeleteKultureById('fail')
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                // Unwrap here
                error.message = error.message.message;
                debug("Caught (expected) error: ", error.message);
                ValidateJSONError(error, 'DeleteKultureById', 'fail', errMsg);
            });
    });
});

describe("UpdateKulture", function () {
    let db, dao;
    let mukStub = sinon.stub(mongoDB.DbAccess.prototype, "MongoUpdateKulture");
    beforeEach(function () {
        db = new mongoDB.DbAccess("mongodb://dummy");
        dao = new DB.DAO(db);
        expect(dao).not.to.be.null;
        expect(dao.db).to.equal(db);
    });
    it("fulfills on success", function () {
        mukStub.resolves(testKulture.ref.id);
        return dao.UpdateKulture(testKulture.ref.id)
            .then((result) => {
                debug("Promise fulfilled with payload: ", result);
                expect(result).not.to.be.null;
                expect(result).to.equal(testKulture.ref.id);
            })
            .catch((error) => {
                debug("Caught error: ", error);
                expect(error).to.be.null; // force fail
            });
    });
    it("rejects on id not found in collection", function () {
        let errMsg = "id not found";
        mukStub.rejects( errMsg );
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        return dao.UpdateKulture(testKulture)
            .then((result) => {
                debug("Promise fulfilled with payload: ", result);
                expect(result).to.be.null;
            })
            .catch((error) => {
                error.message = error.message.message;
                debug("Caught (expected) error: ", error);
                ValidateJSONError(error, 'UpdateKulture', testKulture.ref.id, errMsg );
            });
    });
    it("gracefully fails null kulture arg", function () {
        mukStub.resetBehavior();
        return dao.UpdateKulture(null)
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                debug("Caught (expected) error: ", error);
                ValidateJSONError(error, 'UpdateKulture', 'none', "kulture argument is null");
            });
    });
    it("gracefully fails DB error", function () {
        let errMsg = "MongoDB error code: 999999";
        mukStub.rejects(errMsg);
        // Beware: sinin-as-promised rejects method throws an error object that wraps the message
        //         DAO returns a custom error object with the DB layer's err in the message, so we need to unwrap message.message 
        //         in this test for correct comparisons
        return dao.UpdateKulture(testKulture)
            .then((result) => {
                debug("Promise fulfilled. Not sure why: ", result);
                expect(result).to.be.null; // force fail
            })
            .catch((error) => {
                // Unwrap here
                error.message = error.message.message;
                debug("Caught (expected) error: ", error.message);
                ValidateJSONError(error, 'UpdateKulture', testKulture.ref.id, errMsg);
            });
    });
});

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
				//debug( " ... client state at start: ", db );

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