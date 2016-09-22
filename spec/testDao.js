var RSVP = require( 'rsvp' );
var loki = require( 'lokijs' );
var debug = require('debug')('kulture:testDao');

exports.DAO = {
    db: null,
    kulture_collection: null,

	CreateDB: function( dbName, collName ) {
	    debug( "CreateDB( " + dbName + ", " + collName + " )" );
	    // Create the database:
	    this.db = new loki( dbName !== undefined ? dbName : 'loki.json' );

	    // Create a collection:
	    this.kulture_collection = this.db.addCollection(
	        collName !== undefined ? collName : 'kultures' );
	    debug( "--> db collection created: " ); console.log( JSON.stringify( this.kulture_collection ) );
    },

    AddKultureToDB: function( kulture ) {
    	this.kulture_collection.insert( kulture );
    },

	GetKultureById: function ( id ) {
		var response;
		if( id === 'xxx' ) {
			response = {
				status: 404,
				body: {
				    error: {
				      id: id,
				      api: 'GetKulture',
				      message: 'id not found'
				  	}
			    }
			}
		} else {
			response = {
				status: 200,
				body: {
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
    			}
			}
		}
		debug( "--> sending:" );
		debug( response );
		return response;
 	},

	GetKultureByIdPromise: function( getId ) {
		debug( "--> GetKultureByIdPromise received:" + getId );
		return new RSVP.Promise( function( fulfill, reject ) {
			// get a value from some DB
		    //var result = this.kulture_collection.find( { 'ref': { 'id': getId } } );
		    var result = MockGetResult( getId );
		    debug( "mock result: " + result );
		    if( result ) {
		        fulfill( result );
		    } else {
		        //console.error( "AddRegion->Insert error: ", e );
		        reject( 'failed to fetch id: ' + getId );
		    }
		});
	},

	DeleteKultureById: function ( id ) {
		var response;
		if( id === 'xxx' ) {
			response = {
				status: 404,
				body: {
				    error: {
				      id: id,
				      api: 'DeleteKulture',
				      message: 'id not found'
				  	}
			    }
			}
		} else {
			response = {
				status: 200,
				body: {
				    ref: {
				      id: '13',
				    }
				}
			}
		}
		debug( "--> sending:" );
		debug( response );
		return response;
 	},
	InsertKulture: function ( kulture ) {
		debug( "--> received:" );
		debug( kulture );
		var response = {
			status: 201,
			body: {
				ref: {
					id: kulture.ref.id,
					name: kulture.ref.name
				}
			}
		}
		debug( "--> sending:" );
		debug( response );
		return response;
	}
}

function MockGetResult( id ) {
	if ( id === 'good' || id === '1.2.3' ) {
		return { ref: { id: 'good', name: 'test result' } };
	} else {
		return null;
	}
}
