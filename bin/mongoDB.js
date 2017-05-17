//"use strict";
var MongoClient = require('mongodb').MongoClient;
var Promise = require('promise');
var _ = require('underscore');
var debugDbAccess = require('debug')('kulture:DbAccess');

/** Constants **/
let KulturesCollectionName = 'kultures';

/**
 * Object to interface with Mongo service, with functionality specific to CRUD ops for kulture objects
 * @constructor
 * @param {string} url - the URI describing the Mongo DB location. Must start with 'mongodb://'
 * @param {Number} [timeOut=4000] - the connection timeout in milliseconds
 * @throws Will throw an Error if the {@link url} param doesn't begin with the 'mongodb://' protocol
 */
function DbAccess(url, timeOut) {
    if (!url.startsWith("mongodb://")) {
        throw new Error("Not a mongodb url: ", url);
    }
    // trim off any trailing / from the url (will add it back with options string)
    this.mongoUrl = (url.endsWith('/')) ? url.substring(0, url.length - 1) : url;
    if (timeOut === undefined) {
        timeOut = 4000; // default
    }
    this.connectStr = this.mongoUrl + "/?connectTimeoutMS=" + timeOut;
    this.connection = null;
    debugDbAccess("DbAccess_ctor url: ", this.mongoUrl, "connectStr: ", this.connectStr);
}

DbAccess.prototype = {
    
	/**
	 * Establish connection to specified Mongo instance
	 * @returns {Promise} mongoClient on success or error message
	 */
    ConnectToMongo: function () {
        var self = this;
        return new Promise(function (fulfill, reject) {
            debugDbAccess("ConnectToMongo: Attempting to connect to ", self.connectStr);
            MongoClient.connect(self.connectStr, function (err, db) {
                if (err) {
                    debugDbAccess("... Error rcvd: ", err);
                    reject(err);
                }
                else {
                    debugDbAccess("... Connected to mongo.");
                    self.connection = db;
                    fulfill(db);
                }
            });
        });
    },

    /**
     * Retrieves a kulture object specified by the id string
     * @param {string} id - the id string to search on. Expected to match kulture.ref.id
     * @returns {Promise} the kulture json if found, an empty object if not, or error message
     */
	MongoFetchId: function (id) {
        var self = this;
        debugDbAccess("MongoFetchId: ", id);
        return new Promise( function (fulfill, reject) {
            self.ConnectToMongo()
                .then( function (connection) {
	                kultureCollection = self.connection.collection('kultures');
	                return kultureCollection.find({ 'ref.id': id }).limit(1).next();
	            })
                .then(function (kulture) {
	                debugDbAccess(".. found: ", kulture);
	                fulfill(kulture !== null ? kulture : {});
	            })
                .catch( function (err) {
                    debugDbAccess( "mongo fetch error: ", err['name'], err['code'], err['message'] );
                    reject( "MongoDb error code: " + err['code'] );
                })
	            .finally( () => {
                	debugDbAccess( "closing MongoClient connection" );
	            	self.connection.close();
	            });
        });
    },

    /**
     * Inserts a kulture object into the 'kultures' collection. Enforces unique id within collection,
     * based on the ref.id property.
     * @param {object} kulture - the kulture object as JSON
     * @returns {Promise} the id of the kulture object on success, or error message
     * @throws if {@link kulture} doesn't contain a ref.id property
     */
    MongoInsertKulture: function (kulture) {
        var self = this;
        debugDbAccess("MongoInsertKulture: ", kulture.ref.id);
		//return Promise.reject("Bomb");
        if (! ( kulture.hasOwnProperty("ref")
                && kulture.ref.hasOwnProperty("id") ) ) {
            debugDbAccess("MongoInsertKulture: missing ref.id property. Rejecting");
            return Promise.reject("object missing ref.id property");
        }
        return new Promise( function (fulfill, reject) {
            self.ConnectToMongo()
                .then( function (connection) {
	                kultureCollection = connection.collection( KulturesCollectionName );
					debugDbAccess( "MongoInsertKulture: connected. Created collection: ", KulturesCollectionName );
       	            return kultureCollection.insertOne(kulture);
        	    })
            	.then( function (result) {
                	debugDbAccess(".. insert count: ", result.insertedCount);
	                fulfill(kulture.ref.id);
	            })
    	        .catch( function (err) {
	               debugDbAccess( "mongo insert error: ", err['name'], err['code'], err['message'] );
                    if( err['code']===11000 ) {
                        reject( "duplicate id" );
                    } else {
 	                    reject( "MongoDb error code: " + err['code'] );
                    }
 	        	})
    	    	.finally( () => {
        	    	debugDbAccess( "closing MongoClient connection" );
            		self.connection.close();
	        	});
        });
    },

    /**
     * Deletes a kulture object specified by the id string
     * @param {string} kultureId - the id string of the object to delete. Expected to match kulture.ref.id
     * @returns {Promise} the id of the kulture object on success, or error message
     */
    MongoDeleteKulture: function (kultureId) {
        var self = this;
        debugDbAccess("MongoDeleteKulture ID: ", kultureId);
        return new Promise( function (fulfill, reject) {
            self.ConnectToMongo()
                .then(function (connection) {
	                kultureCollection = self.connection.collection('kultures');
	                return kultureCollection.deleteOne({ 'ref.id': kultureId });
	            } )
	            .then( function (result) {
                    debugDbAccess(".. delete count: ", result.deletedCount);
                    if (result.deletedCount == 1)
                        fulfill(kultureId)
                    else
                        reject("id not found");    
	            })
                .catch( function (err) {
                   debugDbAccess( "mongo delete error: ", err['name'], err['code'], err['message'] );
                   reject( "MongoDb error code: " + err['code'] );
                })
			    .finally( () => {
		    	    debugDbAccess( "closing MongoClient connection" );
		        	self.connection.close();
		        });
        });
    },

    /**
     * Updates a kulture object in the 'kultures' collection. Does not allow change of kulture.ref.id.
     * @param {object} kulture - the kulture object that is replacing the previous object with a matching kulture.ref.id
     * @returns {Promise} the id of the kulture object on success, or error message
     * @throws if {@link kulture} doesn't contain a ref.id property
     */
    MongoUpdateKulture: function (kulture) {
        var self = this;
        debugDbAccess("MongoUpdateKulture: ", kulture);
        if (!(kulture.hasOwnProperty("ref")
            && kulture.ref.hasOwnProperty("id"))) {
            debugDbAccess("MongoUpdateKulture: missing ref.id property. Rejecting");
            return Promise.reject("object missing ref.id property");
        }
        return new Promise(function (fulfill, reject) {
            self.ConnectToMongo()
                .then(function (connection) {
                    kultureCollection = connection.collection(KulturesCollectionName);
                    debugDbAccess("MongoUpdateKulture: connected. Created collection: ", KulturesCollectionName);
                    return kultureCollection.update(
                        { "ref.id": kulture.ref.id },
                        { $set: kulture }
                    );
                })
                .then(function (result) {
                   // debugDbAccess(".. update result:", result);
                    debugDbAccess(".. update count: \nModified -", result.result);
                    if (result.result.ok == 1 && result.result.nModified == 0) {
                        reject("id not found");
                    }
                    fulfill(kulture.ref.id);
                })
                .catch(function (err) {
                    debugDbAccess("mongo insert error: ", err['name'], err['code'], err['message']);
                    reject("MongoDb error code: " + err['code']);
                })
                .finally(() => {
                    debugDbAccess("closing MongoClient connection");
                    self.connection.close();
                });
       });
    }

};

module.exports = { DbAccess: DbAccess };
