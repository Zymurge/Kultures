var assert = require( 'assert' );
var Kulture = require('../bin/kulture_data').Kulture;
var ValidateThis = require('../bin/kulture_data').ValidateThis;
var ValidationErrors = require('../bin/kulture_data').ValidationErrors;
var debug = require( 'debug' )( 'test:kulture' );

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
let should = chai.should;

describe( "Test JSON actually is JSON", function() {
	it( "Can extract items", function(done) {
		debug( "test_json is type " + typeof test_json );
		assert.equal( typeof test_json, "object" );
		assert.equal( typeof test_json.ref.id, "string" );
		assert.equal( test_json.ref.id, '13' );
		done();
	})
});

describe( "Ctor basics", function() {
	it( "Properly constructs object", function(done) {
		let k = new Kulture( test_json );
		expect( k ).not.to.be.null;
		expect( typeof k ).to.equal( 'object' );
		done();
	} );
	it( "Throws on undefined argument", function(done) {
		let k = function() {
			var boom = Kulture( undefined );
		}
		expect( k ).to.throw( "called with undefined argument" );
		done();
	} );
	it( "Validates ref node of json", function(done) {
		ExpectJSONValidateToThrow( test_json, "ref.id" );
		ExpectJSONValidateToThrow( test_json, "ref.name" );
		ExpectJSONValidateToThrow( test_json, "ref" );
		done();
	} );
	it( "Validates display node of json", function(done) {
		ExpectJSONValidateToThrow( test_json, "display.loc.z" );
		ExpectJSONValidateToThrow( test_json, "display.image" );
		ExpectJSONValidateToThrow( test_json, "display.loc" );
		ExpectJSONValidateToThrow( test_json, "display" );
		done();
	} );
	it( "Validates attributes node of json", function(done) {
		ExpectJSONValidateToThrow( test_json, "attributes.defense" );
		ExpectJSONValidateToThrow( test_json, "attributes.growth" );
		ExpectJSONValidateToThrow( test_json, "attributes" );
		done();
	} );
	it( "Validates status node of json", function(done) {
		ExpectJSONValidateToThrow( test_json, "status.energy" );
		ExpectJSONValidateToThrow( test_json, "status.health" );
		ExpectJSONValidateToThrow( test_json, "status" );
		done();
	} );

	it( "Cannot be called as a function", function(done) {
		let k = function() {
			var boom = Kulture( test_json );
		}
		expect( k ).to.throw( "Kulture must be called with the new keyword" );
		done();
	})
});

describe( "accessors expose", function() {
	var k;
	beforeEach( function() {
		k = new Kulture( test_json );
	} );

	it( "ref property", function(done) {
		expect( k.ref ).not.to.be.null;
		expect( k.ref.id ).not.to.be.null;
		expect( k.ref.id ).to.equal( '13' );
		done();
	} );
	it( "display property", function(done) {
		expect( k.display ).not.to.be.null;
		expect( k.display.loc ).not.to.be.null;
		expect( k.display.loc.x ).not.to.be.null;
		expect( k.display.loc.y ).not.to.be.null;
		expect( k.display.loc.x ).to.equal( 1 );
		expect( k.display.loc.y ).to.equal( 2 );
		done();
	} );
	it( "attributes property", function(done) {
		expect( k.attributes ).not.to.be.null;
		expect( k.attributes.growth ).not.to.be.null;
		expect( k.attributes.growth['factor'] ).to.equal( 5 );
		done();
	} );
	it( "status property", function(done) {
		expect( k.status ).not.to.be.null;
		expect( k.status.energy ).not.to.be.null;
		expect( k.status.energy ).to.equal( 100 );
		done();
	} );
	it( "Id property", function(done) {
		expect( k.Id ).not.to.be.null;
		expect( k.Id ).to.equal( '13' );
		done();
	} );
});

describe( "Validator validation", function() {
	it( "Proper json", function(done) {
		var result = ValidateThis( test_json );
		expect( result ).to.equal( true, "wtf?");
		done();
	} );
	it( "json missing status.health", function(done) {
		var bad_json = JSON.parse(JSON.stringify(test_json));
		delete bad_json.status.health;
		var result = ValidateThis( bad_json );
		expect( result ).to.equal( false, "wtf?");
		done();
	} );
});

describe( "IsInvalid function", function() {
	it( "Returns false (null) on valid JSON", function(done) {
		var result = ValidationErrors( test_json );
		expect( result ).to.be.null;
		done();	
	});
	it( "Returns true, with accurate reason, on invalid JSON", function(done) {
		var bad_json = RemoveNodeFromJSON( test_json, "attributes.growth" );
		var result = ValidationErrors( bad_json );
		expect( result ).not.to.be.null;
		expect( result.field ).to.contain( 'attributes.growth' );
		done();	
	});
});

// Helper functions

function ExpectJSONValidateToThrow( good_json, deleteNode ) {
	var bad_json = RemoveNodeFromJSON( good_json, deleteNode );
	var matchString = "is required: data." + deleteNode;
	var expectedError = function() { new Kulture( bad_json ) };
	expect( expectedError ).to.throw( matchString );
}

function RemoveNodeFromJSON( good_json, deleteNode ) {
	var bad_json = JSON.parse(JSON.stringify(good_json));
	var fullDeleteNode = "delete bad_json." + deleteNode;
	eval( fullDeleteNode );
	return bad_json;
}

var test_json =  
	{
		ref: {
			id: '13',
			name: 'my name'
		},
		display: {
			loc: {
				x: 1,
				y: 2,
				z: 3
			},
			image: 'unknown'
		},
		attributes: {
			growth: { factor: 5 },
			invade: {},
			defense: {},
		},
		status: {
			energy: 100,
			health: 200
		}
	}
;
