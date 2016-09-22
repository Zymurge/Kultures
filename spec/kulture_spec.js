var assert = require( 'assert' );
var Kulture = require('../bin/kulture_data').Kulture;
var ValidateThis = require('../bin/kulture_data').ValidateThis;
var ValidationErrors = require('../bin/kulture_data').ValidationErrors;
var debug = require( 'debug' )( 'test:kulture' );

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
		expect( k ).toBeTruthy();
		expect( typeof k ).toBe( 'object' );
		done();
	} );
	it( "Throws on undefined argument", function(done) {
		let k = function() {
			var boom = Kulture( undefined );
		}
		expect( k ).toThrow( "called with undefined argument" );
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
		expect( k ).toThrow( "Kulture must be called with the new keyword" );
		done();
	})
});

describe( "accessors expose", function() {
	var k;
	beforeEach( function() {
		k = new Kulture( test_json );
	} );

	it( "ref property", function(done) {
		expect( k.ref ).toBeTruthy();
		expect( k.ref.id ).toBeTruthy();
		expect( k.ref.id ).toBe( '13' );
		done();
	} );
	it( "display property", function(done) {
		expect( k.display ).toBeTruthy();
		expect( k.display.loc ).toBeTruthy();
		expect( k.display.loc.x ).toBeTruthy();
		expect( k.display.loc.y ).toBeTruthy();
		expect( k.display.loc.x ).toBe( 1 );
		expect( k.display.loc.y ).toBe( 2 );
		done();
	} );
});

describe( "Validator validation", function() {
	it( "Proper json", function(done) {
		var result = ValidateThis( test_json );
		expect( result ).toBe( true, "wtf?");
		done();
	} );
	it( "json missing status.health", function(done) {
		var bad_json = JSON.parse(JSON.stringify(test_json));
		delete bad_json.status.health;
		var result = ValidateThis( bad_json );
		expect( result ).toBe( false, "wtf?");
		done();
	} );
});

describe( "IsInvalid function", function() {
	it( "Returns false (null) on valid JSON", function(done) {
		var result = ValidationErrors( test_json );
		expect( result ).toBeNull( "No errors should be null response");
		done();	
	});
	it( "Returns true, with accurate reason, on invalid JSON", function(done) {
		var bad_json = RemoveNodeFromJSON( test_json, "attributes.growth" );
		var result = ValidationErrors( bad_json );
		expect( result ).not.toBeNull( "null response indicates no error" );
		expect( result.field ).toContain( 'attributes.growth' );
		done();	
	});
});

// Helper functions

function ExpectJSONValidateToThrow( good_json, deleteNode ) {
	var bad_json = RemoveNodeFromJSON( good_json, deleteNode );
	var matchString = "is required: data." + deleteNode;
	var expectedError = function() { new Kulture( bad_json ) };
	expect( expectedError ).toThrow( matchString );
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
			growth: {},
			invade: {},
			defense: {},
		},
		status: {
			energy: 100,
			health: 200
		}
	}
;
