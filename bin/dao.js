//"use strict";
var MongoClient = require('mongodb').MongoClient;
var Promise = require('promise');
var _ = require('underscore');
var debugDAO = require('debug')('kulture:DAO');
var debugDbAccess = require('debug')('kulture:DbAccess');

function DAO(dbConnection) {
    debugDAO("DAO_ctor: ", dbConnection);
    this.db = dbConnection;
}

DAO.prototype = {
    GetKultureById: function (getId) {
        debugDAO("GetKultureById received: ", getId);
        var self = this;
        var myClient = null;
        return new Promise(function (fulfill, reject) {
            if (getId === null) {
                debugDAO("null param is no bueno");
                reject({ id: 'none', message: 'id argument is null' });
            }
            debugDAO(":: self.db= ", self.db);
            self.db.MongoFetchId(getId)
                .then(function (result) {
                debugDAO("..FetchId return: ", result);
                if (_.isEmpty(result)) {
                    debugDAO("....empty set = fail");
                    reject({ id: getId, message: "id not found" });
                }
                else {
                    fulfill(result);
                }
                ;
            })
                .catch(function (err) {
                reject(err);
            });
        });
    },
    InsertKulture: function (kulture) {
        var self = this;
        debugDAO(".. InsertKulture received:" + JSON.stringify(kulture));
        return new Promise(function (fulfill, reject) {
            if (kulture === null) {
                debugDAO("null param is no bueno");
                reject({ id: 'none', message: 'kulture argument is null' });
            }
            self.db.MongoInsertKulture(kulture)
                .then(function (result) {
                debugDAO(".... insert result: " + JSON.stringify(result));
                fulfill(result);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    },
    DeleteKultureById: function (kultureId) {
        debugDAO("GetKultureById received: ", kultureId);
        var self = this;
        var myClient = null;
        return new Promise(function (fulfill, reject) {
            if (kultureId === null) {
                debugDAO("null param is no bueno");
                reject({ id: 'none', message: 'id argument is null' });
            }
            debugDAO(":: self.db= ", self.db);
            self.db.MongoDeleteKulture(kultureId)
                .then(function (result) {
                debugDAO("..DeleteId return: ", result);
                if (_.isEmpty(result)) {
                    debugDAO("....empty set = fail");
                    reject({ id: kultureId, message: "id not found" });
                }
                else {
                    fulfill(result);
                }
                ;
            })
                .catch(function (err) {
                reject(err);
            });
        });
    }
};

/**
 * Object to interface with Mongo service, with functionality specific to CRUD ops for kulture objects
 * @constructor
 * @param {string} url - the URI describing the Mongo DB location. Must start with 'mongodb://'
 @ @param {Number} [timeOut=4000] - the connection timeout in milliseconds
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
            debugDbAccess("Attempting to connect to ", self.connectStr);
            MongoClient.connect(self.connectStr, function (err, db) {
                if (err) {
                    debugDbAccess("Error rcvd: ", err);
                    reject(err);
                }
                else {
                    debugDbAccess("Connected to mongo");
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
                .catch(function (err) {
	                debugDbAccess("mongo fetch error: ", err);
	                reject(err);
	            })
	            .finally( () => {
	            	debugDbAccess( "closing MongoClient connection" );
	            	self.connection.close();
	            });
        });
    },

    /**
     * Inserts a kulture object into the 'kultures' collection. Enforces unique id within collection
     * @param {object} kulture - the kulture object as JSON
     * @returns {Promise} the id of the kulture object on success, or error message
     */
    MongoInsertKulture: function (kulture) {
        var self = this;
        debugDbAccess("MongoInsertKulture: ", kulture.ref.id);
        return new Promise( function (fulfill, reject) {
            self.ConnectToMongo()
                .then( function (connection) {
	                kultureCollection = self.connection.collection('kultures');
    	            return kultureCollection.insertOne(kulture);
        	    })
            	.then( function (result) {
                	debugDbAccess(".. insert count: ", result.insertedCount);
	                fulfill(kulture.ref.id);
	            })
    	        .catch( function (err) {
	               debugDbAccess("mongo insert error: ", err);
 	               reject(err);
 	        	})
    	    	.finally( () => {
        	    	debugDbAccess( "closing MongoClient connection" );
            		self.connection.close();
	        	});
        });
    },

    /**
     * Deletes a kulture object specified by the id string
     * @param {string} id - the id string  of the object to delete. Expected to match kulture.ref.id
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
	            .then(function (result) {
	                debugDbAccess(".. delete count: ", result.deletedCount);
	                fulfill(kultureId);
	            })
	            .catch(function (err) {
	                debugDbAccess("mongo delete error: ", err);
	                reject(err);
	            })
			    .finally( () => {
		    	    debugDbAccess( "closing MongoClient connection" );
		        	self.connection.close();
		        });
        });
    }
};

module.exports = { DAO: DAO, DbAccess: DbAccess };
