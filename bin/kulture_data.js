var debug = require('debug')('kulture:kulture_data');
module.exports = { Kulture, ValidateThis, ValidationErrors };

function Kulture( json ) {
  var debug = require('debug')('kulture:kulture_object');
  debug( "ctor arg = " + json );

  if( typeof json === 'undefined' )
    throw new TypeError( 'called with undefined argument' );

	if (!(this instanceof Kulture))
    throw new Error("Kulture must be called with the new keyword");
 
	var isValid = validate( json );
	if( ! isValid ) {
		throw new TypeError( validate.errors[0].message + ': ' + validate.errors[0].field );
	}

  this.data = JSON.parse( JSON.stringify(json) );
  this.ref = this.data.ref;
  this.display = this.data.display;
  debug( "ctor(ref.id) = " + this.ref.id );
  //this.ref = json.ref;
};

function ValidateThis( json ) {
  var isValid = validate( json );
	debug( validate.errors );
	return isValid;
};

// Rsponds null for valid JSON. If invalid, will reply with JSON containing reason.
function ValidationErrors( json ) {
  debug( "json:", json );
  var isValid = validate( json );
  debug( "isValid: " + isValid );
  if( isValid ) return null;

  // fall through else to reformat array to JSON
  debug( "Errors: " + validate.errors[0] );
  return validate.errors[0];
}

var validator = require('is-my-json-valid');

var validate = validator({
  title: 'Kulture data definition',
  type: 'object',
  required: true,
  properties: {
    ref: {
    	type: 'object',
    	properties: {
    		id: { type: 'string' },
    		name: { type: 'string' }
    	},
    	required: ['name', 'id']
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
  required: [ 'ref', 'display', 'attributes', 'status' ]
})
