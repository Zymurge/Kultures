let assert = require( 'assert' );
let Kulture = require('../bin/kulture_data').Kulture;
let ValidateThis = require('../bin/kulture_data').ValidateThis;
let ValidationErrors = require('../bin/kulture_data').ValidationErrors;
let debug = require( 'debug' )( 'test:kulture' );

describe( "Verify test JSON", function() {
	it("is actually JSON", function (done) {
		debug("test_json is type " + typeof test_json);
		expect(test_json).to.be.a('object');
		done();
	})
	it("has some of the expected properties and values", function (done) {
		expect(test_json).to.have.property('_id');
		expect(test_json).to.have.property('ref');
		expect(test_json._id).to.equal('13');
		expect(test_json).to.have.property('status');
		expect(test_json).to.have.deep.property('status.health', 200);
		done();
	})
});

describe( "Kulture ctor basics", function() {
	it( "Properly constructs object", function(done) {
		let k = new Kulture( test_json );
		expect(k).ok;
		expect(k).to.be.a('object');
		expect(k).to.be.an.instanceof(Kulture);
		done();
	} );
	it( "Throws on undefined argument", function(done) {
		let k = function() {
			var boom = Kulture( undefined );
		}
		expect( k ).to.throw( "called with undefined argument" );
		done();
	} );
	it("Enforces _id property (needed by Mongo)", function (done) {
		ExpectJSONValidateToThrow(test_json, "_id");
		done();
	})
	it("Validates ref node of json", function (done) {
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

describe( "Kulture accessors", function() {
	var k;
	beforeEach( function() {
		k = new Kulture( test_json );
	})

	it("Id getter", function (done) {
		expect(k.Id).ok;
		expect(k.Id).to.equal(test_json._id);
		done();
	})
	it("disallow _id change", function (done) {
		k._id = "illegal op on _id";
		expect(k.Id).ok;
		expect(k.Id).to.equal(test_json._id);
		done();
	})
	it("disallow Id change", function (done) {
		k.Id = "illegal op on Id";
		expect(k.Id).ok;
		expect(k.Id).to.equal(test_json._id);
		done();
	})
	it("expose Ref property", function (done) {
		expect(k.Ref).ok;
		expect(k.Ref.name ).ok;
		expect(k.Ref.name ).to.equal( test_json.ref.name );
		done();
	})
	it( "expose Display property", function(done) {
		expect(k.Display).ok;
		expect(k.Display.loc).ok;
		expect(k.Display.loc.x).ok;
		expect(k.Display.loc.y).ok;
		expect(k.Display.loc.x).to.equal(test_json.display.loc.x);
		expect(k.Display.loc.y).to.equal(test_json.display.loc.y);
		done();
	})
	it( "expose Attributes property", function(done) {
		expect(k.Attributes ).ok;
		expect(k.Attributes.growth ).ok;
		expect(k.Attributes.growth.factor).ok;
		expect(k.Attributes.growth.factor).to.equal(test_json.attributes.growth.factor);
		done();
	})
	it( "expose Status property", function(done) {
		expect(k.Status).ok;
		expect(k.Status.energy).ok;
		expect(k.Status.energy).to.equal(test_json.status.energy);
		done();
	})

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
		expect( result ).ok;
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
		_id: '13',
		ref: {
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
