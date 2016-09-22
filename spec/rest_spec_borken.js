let Promise = require( 'promise' );
let frisby = require('frisby');
let DB = require('../bin/dao');
let MongoClient = require('mongodb').MongoClient;
let debug = require( 'debug' )( 'test:rest' );

var test_user = "Test Dude";
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
var delKultueExpected = {
    ref: {
      id: '13'
    }
}


// preload a record into mongo
MongoClient.connect( "mongodb://localhost", function( err, db ) {
  if( err ) { 
    debug( "Populate DB: Couldn't connect to mongo ", err );
  } else {
    debug( "Populate DB: Connected to mongo" );
    // insert test kulture here 
    db.collection( 'kulture' ).insertOne( testKulture );
    debug( "MongoAdd: inserted test record" );
    db.close();
  };
} );


frisby.create('Server is running')
  .get('http://localhost:3000')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'text/html')
  .expectBodyContains( 'Welcome to Kultures')
.toss();

/*spyOn( DB.DbAccess.prototype, 'MongoFetchId' ).andCallFake( () => {
    debug( "..in MongoFetchId fake" );
    Promise.resolve( testKulture )
  } 
);*/
frisby.create('Can get a kulture by id')
  .get('http://localhost:3000/api/kulture/13')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON( testKulture )
.toss();

/*
frisby.create('Get a kulture for non-existent id returns proper messaging')
  .get('http://localhost:3000/api/kulture/xxx')
  .expectStatus(404)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    error: {
      id: 'xxx',
      api: 'GetKulture',
      message: 'id not found'
    }
  })
.toss();

frisby.create('Get a kulture with missing id returns proper messaging')
  .get('http://localhost:3000/api/kulture')
  .expectStatus(400)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    error: {
      id: 'none',
      api: 'GetKulture',
      message: 'URI did not include id'
    }
  })
.toss();

frisby.create('Can delete a kulture by id')
  .delete('http://localhost:3000/api/kulture/13')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON( delKultueExpected )
.toss();

frisby.create('Delete a kulture for non-existent id returns proper messaging')
  .delete('http://localhost:3000/api/kulture/xxx')
  .expectStatus(404)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    error: {
      id: 'xxx',
      api: 'DeleteKulture',
      message: 'id not found'
    }
  })
.toss();

frisby.create('Delete a kulture with missing id returns proper messaging')
  .delete('http://localhost:3000/api/kulture')
  .expectStatus(400)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    error: {
      id: 'none',
      api: 'DeleteKulture',
      message: 'URI did not include id'
    }
  })
.toss();

frisby.create('Can an insert a well formed kulture' )
  .post('http://localhost:3000/api/kulture', testKulture, { json: true } )
  .expectStatus(201)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    ref: {
      id: '13',
      name: 'test kulture'
    }    
  })
  .toss();

  frisby.create('Insert a kulture without JSON body in POST responds 400' )
  .post('http://localhost:3000/api/kulture', "ugh", { json: false } )
  .expectStatus(400)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    error: {
      id: 'none',
      api: 'AddKulture',
      message: 'POST request missing JSON body'
    }
  })
  .toss();

frisby.create('Insert a kulture with invalid JSON format in POST responds 400' )
  .post('http://localhost:3000/api/kulture', 
      {
        ref: {
          id: '-5',
          name: 'malformed kulture'
        },
        display: {
          loc: {
            a: 1,
            b: 2,
            c: 3
          }
        },
        status: {
          energy: 500,
          health: 333
        }   
      },  
      { json: true } 
   )
  .expectStatus(400)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    error: {
      id: 'none',
      api: 'AddKulture',
      message: 'POST request JSON body not a valid kulture'
    }
  })
  .toss();

//frisby.create('Dummy test').toss();

/*
frisby.create('Can set the user')
  .get('http://localhost:3000/setuser?name=' + test_user)
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    welcome: {
      title: 'Kultures',
      message: 'Welcome '+ test_user
    }
  })
.toss();

frisby.create('Can fetch the user')
  .get('http://localhost:3000/getuser')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON({
    user: {
      name: test_user
    }
  })
.toss();
*/
