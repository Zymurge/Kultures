let DB = require('../bin/dao');
let mongoDB = require('../bin/mongoDB');
let debug = require('debug')('test:DbAccess');
let MongoClient = require('mongodb').MongoClient;
let Promise = require( 'promise' );
let _ = require( 'underscore' );

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

describe("DbAccess constructor", function () {
	it("creates values properly with default timeout", function (done) {
		let db = new mongoDB.DbAccess(testMongoUrl);
		expect(db).ok;
		expect(db.mongoUrl).to.equal(testMongoUrl);
		expect(db.connection).not.ok;
		expect(db.connectStr).to.equal(testMongoUrl + "/?connectTimeoutMS=4000");
		done();
	});
	it("creates values properly with explicit timeout", function (done) {
		let db = new mongoDB.DbAccess(testMongoUrl, 50000);
		expect(db).ok;
		expect(db.connectStr).to.equal(testMongoUrl + "/?connectTimeoutMS=50000");
		done();
	});
	it("handles url with post-pended /", function (done) {
		let pp_url = "mongodb://post-pended_url/";
		let pp_url_fixed = "mongodb://post-pended_url";
		let db = new mongoDB.DbAccess(pp_url);
		expect(db).ok;
		expect(db.mongoUrl).to.equal(pp_url_fixed);
		expect(db.connectStr).to.equal(pp_url + "?connectTimeoutMS=4000");
		done();
	})
	it("rejects url that isn't prepended with the 'mongodb://' protocol string", function (done) {
		let bad_prefix_url = "wrongproto.url";
		expect(() => { new mongoDB.DbAccess(bad_prefix_url); }).to.throw(Error);
		done();
	});
});

describe( "With Mongodb running", function() {
	let client;
	let beforeCnt = 1;
	let running = true; // add check for Mongo running
	beforeEach(function () {
		debug("++++++++\n@beforeEach case #" + beforeCnt++);
		if (running) {
			client = new mongoDB.DbAccess(testMongoUrl);
			return MongoClean(testKultureCollection)
				.then((result) => {
					debug("@beforeEach - MongoClean returned: ", result);
				})
				.catch((err) => {
					debug("@beforeEach - MongoClean fail: ", err);
					expect(err).not.ok("Unable to clean MongoDB");
				});
		} else {
			debug("No Mongo, should be skipping this section");
			this.skip("MongoDB is not running");
		};
	});
		
	describe("DbAccess ConnectToMongo", function () {
		it("can connect at localhost", function () {
			return client.ConnectToMongo()
				.then((db) => {
					debug("ConnectToMongo success: ", db.s.databaseName);
					expect(db).ok;
					expect(db.databaseName).ok;
					db.close();
				})
				.catch((err) => {
					debug("ConnectToMongo err: ", err);
					expect(err).not.ok("should not get here with a connection");
				})
		});
	});

	describe("DbAccess MongoInsertKulture", function () {
		it("inserts a record", function () {
			return client.MongoInsertKulture(testKulture)
				.then((id) => {
					debug("MongoInsertKulture successfully inserted: ");
					expect(id, "Return value should be kulture ID").to.equal(testKulture.ref.id);
					return client.MongoFetchId(testKulture.ref.id);
				})
				.then((kulture) => {
					debug("successfully fetched: ", kulture);
					expect(kulture).ok;
					expect(kulture.ref.id).to.equal(testKulture.ref.id);
				})
				.catch((error) => {
					debug("Caught error: ", error);
					expect(error, "Error thrown when success expected").not.ok; // force fail
				})
		});
		it("returns an error on attempt to insert existing id", function () {
			return client.MongoInsertKulture(testKulture)
				.then((id) => {
					debug("successfully inserted: ", id);
					expect(id).to.equal(testKulture.ref.id);
					// if successful try the same insert again
					return client.MongoInsertKulture(testKulture);
				})
				.then((kulture) => {
					debug("success when error expected on duplicate insert");
					expect(result, "Success returned when error expected" ).not.ok; // force fail				
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal('duplicate id');
				})
		});
		it("returns an error on to insert with existing _id field not matching ref.id", function () {
			let mismatchKulture = BuildKultureJSON(99, 98, 97);
			mismatchKulture._id = "no match";
			return client.MongoInsertKulture(mismatchKulture)
				.then((kulture) => {
					debug("success when error expected on _id mismatch");
					expect(result, "Success returned when error expected").not.ok; // force fail				
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal("_id mismatch with ref.id");
				})
		});
		it("handles mongo connection errors on insert", function () {
			let mockClient = GetConnectErrorClient("mongodb://it.dont.matter");
			return mockClient.MongoInsertKulture(testKulture)
				.then((result) => {
					debug("Promise fulfilled. Not sure why: ", result);
					expect(result, "Success returned when error expected" ).not.ok; // force fail
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal("MongoDb error code: -1");
				})
		});
		it("returns an error when given an object without a ref.id property as input", function () {
			let iAintNoKulture = {
				ref: {
					notAnId: '-13',
					name: 'object that kinda looks like a kulture'
				},
				display: {
					loc: {
						x: 1,
						y: 2,
						z: 3
					},
					image: 'none'
				}
			};
			return client.MongoInsertKulture(iAintNoKulture)
				.then((kulture) => {
					debug("success when error expected on duplicate insert");
					expect(result, "Success returned when error expected" ).not.ok; // force fail				
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal('object missing ref.id property');
				})
		});
	});

	describe("DbAccess MongoDeleteKulture", function () {
		it("can delete the preloaded record", function () {
			return MongoAdd(testKulture)
				.then(() => {
					return client.MongoDeleteKulture(testKulture.ref.id);
				})
				.then((id) => {
					debug("successfully deleted: ", testKulture.ref.id);
					expect(id).ok;
					expect(id).to.equal(testKulture.ref.id);
				})
				.catch((error) => {
					debug("Caught error: ", error);
					expect(error, "Error thrown when success expected").not.ok; // force fail
				});
		});
		it("returns an error on attempt to delete a non-existent id", function () {
			return client.MongoDeleteKulture('dummyId')
				.then(() => {
					debug("Promise fulfilled. Not sure why: ", result);
					expect(result, "Success returned when error expected" ).not.ok; // force fail
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal("id not found");
				});			
		});
		it("handles mongo connection errors on delete", function () {
			let mockClient = GetConnectErrorClient("mongodb://it.dont.matter");
			return mockClient.MongoDeleteKulture("dummy ID")
				.then((result) => {
					debug("Promise fulfilled. Not sure why: ", result);
					expect(result, "Success returned when error expected" ).not.ok; // force fail
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error)
					expect(error).ok;
					expect(error).to.equal("MongoDb error code: -1");
				});
		});
	});

	describe("DbAccess MongoFetchId", function () {
		it("can fetch the preloaded record", function () {
			return MongoAdd(testKulture)
				.then(() => {
					debug("MongoFetchId: successfully added test record");
					debug("MongoFetchId: calling client: ", client);
					let result = client.MongoFetchId(testKulture.ref.id);
					debug("MongoFetchId: result: ", result);
					return result;
				})
				.then((kulture) => {
					debug("MongoFetchId: successfully fetched: ", kulture);
					expect(kulture).ok;
					expect(kulture.ref.id).to.equal(testKulture.ref.id);
				})
				.catch((error) => {
					debug("MongoFetchId: Caught error: ", error);
					expect(error, "Error thrown when success expected").not.ok; // force fail
				});
		});
		it("handles a missing record", function () {
			return client.MongoFetchId('0')
				.then((kulture) => {
					debug("successfully fetched: ", kulture);
					expect(kulture).ok;
					expect(_.isEmpty(kulture)).to.equal(true);
				})
				.catch((error) => {
					debug("Caught error: ", error);
					expect(error, "Error thrown when success expected").not.ok; // force fail
				})
		});
		it("handles mongo connection errors on fetch", function () {
			let mockClient = GetConnectErrorClient("mongodb://it.dont.matter");
			return mockClient.MongoFetchId("dummy ID")
				.then((result) => {
					debug("Promise fulfilled. Not sure why: ", result);
					expect(result, "Success returned when error expected" ).not.ok; // force fail
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal("MongoDb error code: -1");
				});
		});
	});

	describe("DbAccess MongoUpdateKulture", function () {
		it("updates a record", function () {
			let kultureToUpdate = BuildKultureJSON(12, 9, 6);
			return MongoAdd(kultureToUpdate)
				.then(() => {
					debug("added record to update")
					kultureToUpdate.ref.name = "Change me";
					kultureToUpdate.attributes.energy = -1;
					return client.MongoUpdateKulture(kultureToUpdate);
				})
				.then((id) => {
					debug("successfully updated: ", kultureToUpdate.ref.id);
					expect(id).ok;
					return fetchKulture = client.MongoFetchId(id);
				})
				.then((kulture) => {
					debug("fetch kulture to validate update");
					expect(kulture.ref.id).to.equal(kultureToUpdate.ref.id);
					expect(kulture.ref.name).to.equal(kultureToUpdate.ref.name);
					expect(kulture.attributes.energy).to.equal(kultureToUpdate.attributes.energy);
				})
				.catch((error) => {
					debug("Caught error: ", error);
					expect(error, "Error thrown when success expected").not.ok; // force fail
				});
		});
		it("returns an error on attempt to update a non-existent id", function () {
			return client.MongoUpdateKulture(testKulture)
				.then(() => {
					debug("Promise fulfilled. Not sure why: ", result);
					expect(result, "Success returned when error expected").not.ok; // force fail
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal("id not found");
				});
		});
		it("returns an error when given an object without a ref.id property as input", function () {
			let iAintNoKulture = {
				ref: {
					notAnId: '-13',
					name: 'object that kinda looks like a kulture'
				},
				display: {
					loc: {
						x: 1,
						y: 2,
						z: 3
					},
					image: 'none'
				}
			};
			return client.MongoUpdateKulture(iAintNoKulture)
				.then((kulture) => {
					expect(result, "Success when error expected. No ref.id property").not.ok; // force fail				
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal('object missing ref.id property');
				})
		});
		it("handles mongo connection errors on update", function () {
			let mockClient = GetConnectErrorClient("mongodb://it.dont.matter");
			return mockClient.MongoUpdateKulture(testKulture)
				.then((result) => {
					debug("Promise fulfilled. Not sure why: ", result);
					expect(result, "Success returned when error expected" ).not.ok; // force fail
				})
				.catch((error) => {
					debug("Caught (expected) error: ", error);
					expect(error).ok;
					expect(error).to.equal("MongoDb error code: -1");
				})
		});
	});
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

let MongoAdd = function (kulture) {
	// ensure that the _id field for Mongo is synced
	kulture._id = kulture.ref.id;
	return new Promise( function( fulfill, reject ) {
		MongoClient.connect( testMongoUrl, function( err, db ) {
			if( err ) { 
				debugUtil( "MongoAdd: Couldn't connect to mongo ", err );
				reject(  "MongoAdd error: " + err  );
			} else {
				debugUtil( "MongoAdd: Connected to mongo" );
				// insert test kulture here	
				db.collection( testKultureCollection ).insertOne( kulture );
				debugUtil( "MongoAdd: inserted test record:", kulture );
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
