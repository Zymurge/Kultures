"use strict"; 

let sinon = require( 'sinon' );
require( 'sinon-as-promised' );

let chai = require( 'chai' );
let chaiAsPromised = require( 'chai-as-promised' );
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.should = chai.should;
global.sinon = sinon;