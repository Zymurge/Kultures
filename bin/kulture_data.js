var validator = require('is-my-json-valid');
var debug = require('debug')('kulture:kulture_data');

/**
 * A representation of one 'cell' or independent organism.
 * Contains properties to track the location, how it's displayed, it's attributes and current status.
 * @constructor
 * @param {Object} data - an object with that adheres to kultures schema in the example below
 * @example
  {
    ref: {
      id: string,
      name: string
    },
    display: {
      loc: {
        x: Number,
        y: Number,
        z: Number
      },
      image: string
    },
    attributes: {
      growth: {tbd},
      invade: {tbd},
      defense: {tbd},
    },
    status: {
      energy: Number,
      health: Number
    }
  }
 */
var Kulture = function Kulture(data) {
  _display = null;

  let debug = require('debug')('kulture:kulture_object');
  debug( "ctor arg = " + data );

  if( typeof data === 'undefined' )
    throw new TypeError( 'called with undefined argument' );

	if ( ! ( this instanceof Kulture ) )
    throw new Error( "Kulture must be called with the new keyword" );
 
	let isValid = validate( data );
	if( ! isValid ) {
		throw new TypeError( validate.errors[0].message + ': ' + validate.errors[0].field );
	}

  // force deep copy
  this._data = JSON.parse( JSON.stringify( data ) );
  // map sections up one level to object attributes
  Object.defineProperties(this, {
    "_id": {
      value: this._data._id
    },
    "Id": {
      "get": function () { return this._id; }
    }
  });
  Object.defineProperties(this, {
    "_ref": {
      value: this._data.ref
    },
    "Ref": {
      "get": function () { return this._ref; }
    }
  });
  Object.defineProperties(this, {
    "_display": {
      value: this._data.display
    },
    "Display": {
      "get": function () { return this._display; }
    }
  });
  Object.defineProperties(this, {
    "_attributes": {
      value: this._data.attributes
    },
    "Attributes": {
      "get": function () { return this._attributes; }
    }
  });
  Object.defineProperties(this, {
    "_status": {
      value: this._data.status
    },
    "Status": {
      "get": function () { return this._status; }
    }
  });

/*  
  this._id = this._data._id;
  this._ref = this._data.ref;
  this._display = this._data.display;
  this._attributes = this._data.attributes;
  this._status = this._data.status;
*/
  debug("ctor(_id) = " + this._id);
};

Kulture.prototype = {
  
  /**
    * @property {readonly} The ID field (from _id) of this kulture
    */
  
  /*
  get Id() {
    return this._id;
   },

  get Ref() {
    return this._ref;
  },

  get Display() {
    return this._display;
  }
  */

}

function ValidateThis( json ) {
  var isValid = validate( json );
	debug( validate.errors );
	return isValid;
};

// Responds null for valid JSON. If invalid, will reply with JSON containing reason.
function ValidationErrors( json ) {
  debug( "json:", json );
  var isValid = validate( json );
  debug( "isValid: " + isValid );
  if( isValid ) return null;

  // fall through else to reformat array to JSON
  debug( "Errors: " + validate.errors[0] );
  return validate.errors[0];
}

var validate = validator({
  title: 'Kulture data definition',
  type: 'object',
  required: true,
  properties: {
    id: { type: 'string' },
    ref: {
    	type: 'object',
    	properties: {
    		name: { type: 'string' }
    	},
    	required: ['name']
    },
    display: {
    	type: 'object',
    	properties: {
    		loc: { 
    			type: 'object',
	    		properties: {
	    			x: { type: 'number' },
	    			y: { type: 'number' },
	    			z: { type: 'number' }
	    		},
	    		required: [ 'x', 'y', 'z' ]
	    	},
    		image: { type: 'string' }
    	},
    	required: ['loc', 'image' ]
    },
    attributes: {
    	type: 'object',
    	properties: {
    		growth: { type: 'object' },
    		invade: { type: 'object' },
    		defense: { type: 'object' },
     	},
    	required: ['growth', 'invade', 'defense' ]
    },
    status: {
    	type: 'object',
    	properties: {
    		energy: { type: 'number' },
    		health: { type: 'number' }
    	},
    	required: ['energy', 'health' ]
    }
  },
  required: [ '_id', 'ref', 'display', 'attributes', 'status' ]
})

module.exports = { Kulture, ValidateThis, ValidationErrors };
