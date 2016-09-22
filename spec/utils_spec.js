let sinon = require('sinon');
let GenError = require( '../bin/utils' ).GenerateErrorJSON;
let debug = require('debug')('utils:test');

describe( "GenerateErrorJSON function", function() {
	it( "generates a valid error message", function(done) {
		myId = 'fud';
		myApi = 'culprit';
		myMessage = 'So broken';
		result = GenError( myId, myApi, myMessage );
		expect( result ).not.toBe( null );
		expect( result.error ).not.toBe( null );
		expect( result.error ).toEqual( jasmine.objectContaining({ id: myId }));
		expect( result.error ).toEqual( jasmine.objectContaining({ api: myApi }));
		expect( result.error ).toEqual( jasmine.objectContaining({ message: myMessage }));
		expect( result ).toEqualJson( testMessage );
		done();
	})
});

var testKulture = {
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

var testMessage = {
    error: {
        id: 'fud',
        api: 'culprit',
        message: 'So broken'
    }
};

function BuildKultureJSON( x, y, z ) {
	var id = x + '.' + y + '.' + z;
	var name = 'I am ' + id;
	var json = 	{
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

