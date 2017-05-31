"use strict";
let Promise = require('promise');
let _ = require('underscore');
let Utils = require('./utils');

let Kulture = require('./kulture_data').Kulture;
let debugDAO = require('debug')('kulture:DAO');

/**
 * Object to interface with the data layer (currently hard wired to MongoDb) with functionality
 * specific to CRUD ops for kulture objects
 * @constructor
 * @param {object} dbConnection - connecter to the MongoDb implementation
 */
function DAO(dbConnection) {
    debugDAO("DAO_ctor: ", dbConnection);
    this.db = dbConnection;
}

DAO.prototype = {
    /**
     * Fetches a {@link Kulture} object by specifying the ID
     * @param {string} getId - the ID string for the Kulture instance
	 * @returns {Promise} {@link Kulture} object on success or reject with a {@link GenerateErrorJSON} error message
     */
    GetKultureById: function (getId) {
        debugDAO("GetKultureById received: ", getId);
        var self = this;
        return new Promise(function (fulfill, reject) {
            if (getId === null) {
                debugDAO("null param is no bueno");
                reject(Utils.GenerateErrorJSON('GetKultureById', 'none', "id argument is null"));
            }
            debugDAO(":: self.db= ", self.db);
            self.db.MongoFetchId(getId)
                .then(function (result) {
                    debugDAO("..FetchId return: ", result);
                    if (_.isEmpty(result)) {
                        debugDAO("....empty set = fail");
                        reject(Utils.GenerateErrorJSON('GetKultureById', getId, "id not found"));
                    }
                    else {
                        let myKulture = new Kulture(result);
                        fulfill(myKulture);
                    };
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('GetKultureById', getId, err));
                 });
        });
    },
    /**
     * Inserts a {@link Kulture} object if the input is a valid Kulture and the _id field is unique in the DB
     * @param {@link Kulture} kulture - the Kulture object to insert
	 * @returns {Promise} the ID of the Kulture object on success or reject with a {@link GenerateErrorJSON} error message
     */
    InsertKulture: function (kulture) {
        var self = this;
        debugDAO("InsertKulture received:", kulture);
        return new Promise(function (fulfill, reject) {
            if (kulture === null) {
                debugDAO("null param is no bueno");
                reject(Utils.GenerateErrorJSON('InsertKulture', 'none', "kulture argument is null"));
            }
            if (!(kulture instanceof Kulture)) {
                debugDAO("called with non-Kulture object:", kulture);
                reject(Utils.GenerateErrorJSON('InsertKulture', 'none', "kulture argument is not a Kulture instance"));
            }
            debugDAO(":: self.db= ", self.db);
            self.db.MongoInsertKulture(kulture)
                .then(function (result) {
                    debugDAO(".... insert result: " + JSON.stringify(result));
                    fulfill(result);
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('InsertKulture', kulture.Id, err));
                });
        });
    },
    /**
     * Deletes the {@link Kulture} object by specifying the ID
     * @param {string} kultureId - the ID string for the Kulture instance to delete
	 * @returns {Promise} the ID of the Kulture object on success or reject with a {@link GenerateErrorJSON} error message
     */
    DeleteKultureById: function (kultureId) {
        debugDAO("DeleteKultureById received: ", kultureId);
        var self = this;
        return new Promise(function (fulfill, reject) {
            if (kultureId === null) {
                debugDAO("null param is no bueno");
                reject(Utils.GenerateErrorJSON('DeleteKultureById', 'none', "kultureId argument is null"));
            }
            debugDAO(":: self.db= ", self.db);
            self.db.MongoDeleteKulture(kultureId)
                .then(function (result) {
                    debugDAO("..DeleteId return: ", result);
                    if (_.isEmpty(result)) {
                        debugDAO("....empty set = fail");
                        reject(Utils.GenerateErrorJSON('DeleteKultureById', kultureId, "kultureId not found"));
                    }
                    else {
                        fulfill(result);
                    };
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('DeleteKultureById', kultureId,  err ));
                });
        });
    },
    /**
     * Updates a {@link Kulture} object if the input is a valid Kulture and the _id field exists in the DB
     * @param {@link Kulture} kulture - the Kulture object to update
	 * @returns {Promise} the ID of the Kulture object on success or reject with a {@link GenerateErrorJSON} error message
     */
    UpdateKulture: function (kulture) {
        var self = this;
        debugDAO(".. UpdateKulture received:", kulture);
        return new Promise(function (fulfill, reject) {
            if (kulture === null) {
                debugDAO("null param is no bueno");
                reject(Utils.GenerateErrorJSON('UpdateKulture', 'none', "kulture argument is null"));
            }
            if (!(kulture instanceof Kulture)) {
                debugDAO("called with non-Kulture object:", kulture);
                reject(Utils.GenerateErrorJSON('UpdateKulture', 'none', "kulture argument is not a Kulture instance"));
            }
            self.db.MongoUpdateKulture(kulture)
                .then(function (result) {
                    debugDAO(".... update result: " + JSON.stringify(result));
                    fulfill(result);
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('UpdateKulture', kulture.Id, err));
                });
        });
    },};

module.exports = { DAO: DAO };
