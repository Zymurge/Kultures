var assert = require( 'assert' );
var Kulture = require('../bin/kulture_data').Kulture;
var Kluster = require('../bin/kluster').Kluster;
var debug = require( 'debug')('test:kluster');

describe( "Helper functions:", function() {
	it( "BuildKultureArray works", function(done) {
		let k = BuildKultureArray( -2, 3 );
		expect( k ).toBeTruthy();
		expect( k.length ).toBe( 216 );
		expect( k[0] ).toBeTruthy();
		expect( k[0].ref ).toBeTruthy();
		expect( k[0].Id ).toBe( '-2.-2.-2' );
		expect( k[215].Id ).toBe( '3.3.3' );
		expect( k[214].display ).toBeTruthy();
		expect( k[214].display.loc.x ).toBe( 3 );
		expect( k[214].display.loc.z ).toBe( 2 );  
		done(); 
	} );
} );

describe( "ctor basics", function() {
	it( "creates the right object type", function(done) {
		let k = new Kluster( BuildKultureArray( -1, 1 ) );
		expect( typeof k ).toBe( 'object' );
		done();
	} );
	it( "Count getter works", function(done) {
		let kultures = BuildKultureArray( 1, 3 );
		let k = new Kluster( kultures );
		expect( k.Count ).toBe( kultures.length );
		done();
	} );
	it( "validates input is array", function(done) {
		let expectedError = function() { new Kluster( "I'm not an array" ) };
		expect( expectedError ).toThrow( "argument is not an array" );
		done();
	} );
	it( "validates all Id values of elements of the array are unique", function(done) {
		let kultures = BuildKultureArray( 1, 2 );
		kultures[3] = BuildKulture( 1, 1, 1);
		
		let expectedError = function() { new Kluster( kultures ) };
		expect( expectedError ).toThrow( "All IDs in array must be unique. Duplicate: " + kultures[3].Id );
		done();
	} );
	it( "validates all elements of input array are valid Kulture objects", function(done) {
		let kultures = BuildKultureArray( 1, 2 );
		kultures[3] = { me: "not a Kulture" };

		let expectedError = function() { new Kluster( kultures ) };
		expect( expectedError ).toThrow( "All elements in the array must be valid Kulture objects" );
		done();
	} );
	it( "cannot be called as a function", function(done) {
		let k = function() {
			let boom = Kluster( [ 'garbage', 'more', 'and a bit more' ] );
		}
		expect( k ).toThrow( "Kluster must be called with the new keyword" );
		done();
	})
} );

describe( "GetById", function() {
	let k;
	beforeEach( function() {
		k = new Kluster( BuildKultureArray( -1, 1 ) );
	} );

	it( "positive test case", function(done) {
		let result = k.GetById( '0.0.0' );
		expect( result ).toBeTruthy();
		expect( result.Id ).toBe( '0.0.0' );
		done();
	} );
		it( "gets the last element", function(done) {
		let result = k.GetById( '1.1.1' );
		expect( result ).toBeTruthy();
		expect( result.Id ).toBe( '1.1.1' );
		done();
	} );

	it( "the id doesn't exist", function(done) {
		let result = k.GetById( '13.13.13' );
		expect( result ).toBeNull();
		done();
	} );
	it( "the id is null", function(done) {
		let result = k.GetById( null );
		expect( result ).toBeNull();
		done();
	} );
} );

describe( "GetByLoc", function() {
	let k;
	beforeEach( function() {
		k = new Kluster( BuildKultureArray( 0, 1 ) );
	} );

	it( "positive test case", function(done) {
		let result = k.GetByLoc( { x: 0, y: 0, z: 0 } );
		expect( result ).toBeTruthy();
		expect( result.Id ).toBe( '0.0.0' );
		done();
	} );
	it( "should work with loc elements out of order", function(done) {
		let result = k.GetByLoc( { z: 0, y: 0, x: 0 } );
		expect( result ).toBeTruthy();
		expect( result.Id ).toBe( '0.0.0' );
		done();
	} );

	it( "the id doesn't exist", function(done) {
		let result = k.GetByLoc( { x: 9, y: 0, z: 0 } );
		expect( result ).toBeNull();
		done();
	} );
	it( "the id format is wrong", function(done) {
		let result = k.GetByLoc( { x: 9, z: 0 } );
		expect( result ).toBeNull();
		done();
	} );
	it( "the id is null", function(done) {
		let result = k.GetByLoc( null );
		expect( result ).toBeNull();
		done();
	} );
} );

describe( "AddKulture", function() {
	var k;
	beforeEach( function() {
		k = new Kluster( BuildKultureArray( -1, 1 ) );
		debug( "beforeEach: k.Count", k.Count );
	} );
	it( "returns error on non-kulture argument", function(done) {
		let result = k.AddKulture( "I'm not a kulture" );
		expect( result ).toBeTruthy();
		expect( result.success ).toBeFalsy();
		expect( result.error ).toBe( "called without kulture object" );
		done();
	} );
	it( "throws on duplicate entry", function(done) {
		let myKulture = BuildKulture( 1, 0, 0 );
		let result = k.AddKulture( myKulture );
		expect( result ).toBeTruthy();
		expect( result.success ).toBeFalsy();
		expect( result.error ).toBe( "called for existing kulture" );
		done();
	} );
	it( "successfully adds and has the count to prove it", function(done) {
		let expectedCount = k.Count + 1;
		debug( "expectedCount", expectedCount );
		let myKulture = BuildKulture( 2, 3, 4 );
		let result = k.AddKulture( myKulture );
		expect( result ).toBeTruthy();
		expect( result.success ).toBe( true );
		debug( "k.Count", k.Count );
		expect( k.Count ).toBe( expectedCount );
		done();
	} );
} );

describe( "DeleteKultureById", function() {
	let k;
	beforeEach( function() {
		k = new Kluster( BuildKultureArray( -1, 1 ) );
	} );
	it( "positive test case", function(done) {
		let expectedCount = k.Count - 1;
		debug( "expectedCount", expectedCount );
		let myId = "1.0.-1";
		let result = k.DeleteKultureById( myId );
		expect( result ).toBeTruthy();
		expect( result.success ).toBe( true );
		expect( k.Count ).toBe( expectedCount );
		done();
	} );
	it( "throws on non-string argument", function(done) {
		let result = k.DeleteKultureById( 13 );
		expect( result ).toBeTruthy();
		expect( result.success ).toBeFalsy();
		expect( result.error ).toBe( "called without string argument" );
		done();
	} );
	it( "returns null on missing id", function(done) {
		let myId = "I don't exist";
		let expectedCount = k.Count;
		let result = k.DeleteKultureById( myId );
		expect( result ).toBeTruthy();
		expect( result.success ).toBeFalsy();
		expect( result.error ).toBe( "called for non-existant kulture" );
		expect( k.Count ).toBe( expectedCount );
		done();
	} );	
} );

/*
  Returns object:
  {
	0pm: id,
	0mp: id,
	p0m: id,
	pm0: id,
	m0p: id,
	mp0: id
  }
 */
describe( "GetNeighbors", function() {
	let k;
	beforeEach( function() {
		k = new Kluster( BuildKultureArray( -1, 1 ) );
	} );
	it( "positive test case", function(done) {
		let neighbors = k.GetNeighbors( '0.0.0' );
		expect( neighbors['0pm'] ).toBeTruthy();
		expect( neighbors['0pm'].Id ).toBeTruthy();
		expect( neighbors['0pm'].Id ).toBe( '0.1.-1' );
		expect( neighbors['m0p'] ).toBeTruthy();
		expect( neighbors['m0p'].Id ).toBeTruthy();
		expect( neighbors['m0p'].Id ).toBe( '-1.0.1' );
		expect( neighbors['pm0'] ).toBeTruthy();
		expect( neighbors['pm0'].Id ).toBeTruthy();
		expect( neighbors['pm0'].Id ).toBe( '1.-1.0' );
		done();
	} );
} );

// Helper functions

function ExpectJSONValidateToThrow( good_json, deleteNode ) {
	let bad_json = RemoveNodeFromJSON( good_json, deleteNode );
	let matchString = "is required: data." + deleteNode;
	let expectedError = function() { new Kulture( bad_json ) };
	//expect( expectedError ).toThrowError( TypeError, eval( matchString ) );
	expect( expectedError ).toThrow( matchString );
}

function RemoveNodeFromJSON( good_json, deleteNode ) {
	let bad_json = JSON.parse(JSON.stringify(good_json));
	let fullDeleteNode = "delete bad_json." + deleteNode;
	eval( fullDeleteNode );
	return bad_json;
}

function BuildKulture( x, y, z ) {
	let id = x + '.' + y + '.' + z;
	let name = 'I am ' + id;
	let json = 	{
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
	let k = new Kulture( json );
	//debug( '- BuildKulture ' + id );
	return k;
}

function BuildKultureArray( start, end ) {
	debug( "Entering BuildKultureArray" );
	let kultures = [];
	for( let x=start; x<=end; x++ ) {
		for( let y=start; y<=end; y++ ) {
			for( let z=start; z<=end; z++ ) {
				kultures.push( BuildKulture( x,y,z ) );
			}
		}
	};
	debug( '... Returning kulture array length ' + kultures.length );
	return kultures;
}

