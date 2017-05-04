//var assert = require( 'assert' );
var Kulture = require('../bin/kulture_data').Kulture;
var Kluster = require('../bin/kluster').Kluster;
var debug = require( 'debug')('test:kluster');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
let should = chai.should;

describe( "Helper functions:", function() {
	it( "BuildKultureArray works", function(done) {
		let k = BuildKultureArray( -2, 3 );
        expect(k).not.to.be.false;
		expect( k.length ).to.equal( 216 );
		expect( k[0] ).not.to.be.null;
        expect( k[0].ref ).not.to.be.null;
		expect( k[0].Id ).to.equal( '-2.-2.-2' );
		expect( k[215].Id ).to.equal( '3.3.3' );
        expect( k[214].display ).not.to.be.null;
		expect( k[214].display.loc.x ).to.equal( 3 );
		expect( k[214].display.loc.z ).to.equal( 2 );  
		done(); 
	} );
} );

describe( "ctor basics", function() {
	it( "creates the right object type", function(done) {
		let k = new Kluster( BuildKultureArray( -1, 1 ) );
		expect( typeof k ).to.equal( 'object' );
		done();
	} );
	it( "Count getter works", function(done) {
		let kultures = BuildKultureArray( 1, 3 );
		let k = new Kluster( kultures );
		expect( k.Count ).to.equal( kultures.length );
		done();
	} );
	it( "validates input is array", function(done) {
		let expectedError = function() { new Kluster( "I'm not an array" ) };
		expect( expectedError ).to.throw( "argument is not an array" );
		done();
	} );
	it( "validates all Id values of elements of the array are unique", function(done) {
		let kultures = BuildKultureArray( 1, 2 );
		kultures[3] = BuildKulture( 1, 1, 1);
		
		let expectedError = function() { new Kluster( kultures ) };
		expect( expectedError ).to.throw( "All IDs in array must be unique. Duplicate: " + kultures[3].Id );
		done();
	} );
	it( "validates all elements of input array are valid Kulture objects", function(done) {
		let kultures = BuildKultureArray( 1, 2 );
		kultures[3] = { me: "not a Kulture" };

		let expectedError = function() { new Kluster( kultures ) };
		expect( expectedError ).to.throw( "All elements in the array must be valid Kulture objects" );
		done();
	} );
	it( "cannot be called as a function", function(done) {
		let k = function() {
			let boom = Kluster( [ 'garbage', 'more', 'and a bit more' ] );
		}
		expect( k ).to.throw( "Kluster must be called with the new keyword" );
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
		expect( result ).not.to.be.null;
		expect( result.Id ).to.equal( '0.0.0' );
		done();
	} );
		it( "gets the last element", function(done) {
		let result = k.GetById( '1.1.1' );
		expect( result ).not.to.be.null;
		expect( result.Id ).to.equal( '1.1.1' );
		done();
	} );

	it( "the id doesn't exist", function(done) {
		let result = k.GetById( '13.13.13' );
		expect( result ).to.be.null;
		done();
	} );
	it( "the id is null", function(done) {
		let result = k.GetById( null );
		expect( result ).to.be.null;
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
		expect( result ).not.to.be.null;
		expect( result.Id ).to.equal( '0.0.0' );
		done();
	} );
	it( "should work with loc elements out of order", function(done) {
		let result = k.GetByLoc( { z: 0, y: 0, x: 0 } );
		expect( result ).not.to.be.null;
		expect( result.Id ).to.equal( '0.0.0' );
		done();
	} );

	it( "the id doesn't exist", function(done) {
		let result = k.GetByLoc( { x: 9, y: 0, z: 0 } );
		expect( result ).to.be.null;
		done();
	} );
	it( "the id format is wrong", function(done) {
		let result = k.GetByLoc( { x: 9, z: 0 } );
		expect( result ).to.be.null;
		done();
	} );
	it( "the id is null", function(done) {
		let result = k.GetByLoc( null );
		expect( result ).to.be.null;
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
		expect( result ).not.to.be.null;
		expect( result.success ).to.be.false;
		expect( result.error ).to.equal( "called without kulture object" );
		done();
	} );
	it( "throws on duplicate entry", function(done) {
		let myKulture = BuildKulture( 1, 0, 0 );
		let result = k.AddKulture( myKulture );
		expect( result ).not.to.be.null;
		expect( result.success ).to.be.false;
		expect( result.error ).to.equal( "called for existing kulture" );
		done();
	} );
	it( "successfully adds and has the count to prove it", function(done) {
		let expectedCount = k.Count + 1;
		debug( "expectedCount", expectedCount );
		let myKulture = BuildKulture( 2, 3, 4 );
		let result = k.AddKulture( myKulture );
		expect( result ).not.to.be.null;
		expect( result.success ).to.equal( true );
		debug( "k.Count", k.Count );
		expect( k.Count ).to.equal( expectedCount );
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
		expect( result ).not.to.be.null;
		expect( result.success ).to.equal( true );
		expect( k.Count ).to.equal( expectedCount );
		done();
	} );
	it( "throws on non-string argument", function(done) {
		let result = k.DeleteKultureById( 13 );
		expect( result ).not.to.be.null;
		expect( result.success ).to.be.false;
		expect( result.error ).to.equal( "called without string argument" );
		done();
	} );
	it( "returns null on missing id", function(done) {
		let myId = "I don't exist";
		let expectedCount = k.Count;
		let result = k.DeleteKultureById( myId );
		expect( result ).not.to.be.null;
		expect( result.success ).to.be.false;
		expect( result.error ).to.equal( "called for non-existant kulture" );
		expect( k.Count ).to.equal( expectedCount );
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
		expect( neighbors['0pm'] ).not.to.be.null;
		expect( neighbors['0pm'].Id ).not.to.be.null;
		expect( neighbors['0pm'].Id ).to.equal( '0.1.-1' );
		expect( neighbors['m0p'] ).not.to.be.null;
		expect( neighbors['m0p'].Id ).not.to.be.null;
		expect( neighbors['m0p'].Id ).to.equal( '-1.0.1' );
		expect( neighbors['pm0'] ).not.to.be.null;
		expect( neighbors['pm0'].Id ).not.to.be.null;
		expect( neighbors['pm0'].Id ).to.equal( '1.-1.0' );
		done();
	} );
} );

// Helper functions

function ExpectJSONValidateToThrow( good_json, deleteNode ) {
	let bad_json = RemoveNodeFromJSON( good_json, deleteNode );
	let matchString = "is required: data." + deleteNode;
	let expectedError = function() { new Kulture( bad_json ) };
	//expect( expectedError ).to.throwError( TypeError, eval( matchString ) );
	expect( expectedError ).to.throw( matchString );
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

