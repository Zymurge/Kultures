let sinon = require('sinon');
let GenError = require( '../bin/utils' ).GenerateErrorJSON;
let debug = require('debug')('utils:test');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
let should = chai.should;

describe( "GenerateErrorJSON function", function() {
	it( "generates a valid error message", function(done) {
		myId = 'fud';
		myApi = 'culprit';
		myMessage = 'So broken';
		result = GenError( myId, myApi, myMessage );
        expect(result).ok;
        expect( result ).to.have.property( 'error' );
        expect( result.error ).to.include({ id: myId });
		expect( result.error ).to.include({ api: myApi });
		expect( result.error ).to.include({ message: myMessage });
        expect( JSON.stringify(result) ).to.equal( JSON.stringify(testMessage ));
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

