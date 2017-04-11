//"use strict";
var MongoClient = require('mongodb').MongoClient;
var Promise = require('promise');
var _ = require('underscore');
let Utils = require('./utils');
var debugDAO = require('debug')('kulture:DAO');

function DAO(dbConnection) {
    debugDAO("DAO_ctor: ", dbConnection);
    this.db = dbConnection;
}

DAO.prototype = {
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
                        fulfill(result);
                    };
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('GetKultureById', getId, err));
                 });
        });
    },
    InsertKulture: function (kulture) {
        var self = this;
        debugDAO(".. InsertKulture received:" + JSON.stringify(kulture));
        return new Promise(function (fulfill, reject) {
            if (kulture === null) {
                debugDAO("null param is no bueno");
                reject(Utils.GenerateErrorJSON('InsertKulture', 'none', "kulture argument is null"));
            }
            self.db.MongoInsertKulture(kulture)
                .then(function (result) {
                    debugDAO(".... insert result: " + JSON.stringify(result));
                    fulfill(result);
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('InsertKulture', kulture.ref.id, err));
                });
        });
    },
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
    UpdateKulture: function (kulture) {
        var self = this;
        debugDAO(".. UpdateKulture received:" + JSON.stringify(kulture));
        return new Promise(function (fulfill, reject) {
            if (kulture === null) {
                debugDAO("null param is no bueno");
                reject(Utils.GenerateErrorJSON('UpdateKulture', 'none', "kulture argument is null"));
            }
            self.db.MongoUpdateKulture(kulture)
                .then(function (result) {
                    debugDAO(".... update result: " + JSON.stringify(result));
                    fulfill(result);
                })
                .catch(function (err) {
                    debugDAO("DbAccess threw: " + err);
                    reject(Utils.GenerateErrorJSON('UpdateKulture', kulture.ref.id, err));
                });
        });
    },};

module.exports = { DAO: DAO };
