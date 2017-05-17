let GenError = require( '../bin/utils' ).GenerateErrorJSON;
let debug = require('debug')('utils:test');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
let should = chai.should;

describe( "GenerateErrorJSON function", function() {
    it("generates a valid error message", function (done) {
        myId = 'fud';
        myApi = 'culprit';
        myMessage = 'So broken';
        result = GenError(myApi, myId, myMessage);
        expect(result).ok;
        expect(result).to.include({ api: myApi });
        expect(result).to.include({ id: myId });
        expect(result).to.include({ message: myMessage });
        done();
    });
    describe("generates correct default values", function() {
        let myId = 'none';
        let myApi = 'unspecified';
        let myMessage = '';
        let result;
        afterEach(function (done) {
            expect(result).ok;
            expect(result).to.include({ api: myApi });
            expect(result).to.include({ id: myId });
            expect(result).to.include({ message: myMessage });
            done();
        } );
        it("when given no args ", function () {
            result = GenError();
        });
        it("when given all null args ", function () {
            result = GenError(null, null, null);
        });
        it("when given a mix of null and valid args", function () {
            // Warning: global value changed, reset in subsequent cases
            myId = 'TestId';
            result = GenError(null,myId);
        });
        // Test the tests, given my first time with all validations in the afterEach
        it.skip("this should fail", function () {
            result = GenError(null, 'fail me', 'twice' );
        }); 
    })
});

/*** Helpers ***/

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
    api: 'culprit',
    id: 'fud',
    message: 'So broken'
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

