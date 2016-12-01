var Kulture = require( './kulture_data' ).Kulture;
var _ = require( 'underscore' );
var debug = require('debug')('kluster:core');

/**
 * @classdesc Represents a cluster of kulture objects. Contains CRUD operations and (eventually) helper functions.
 * @constructor
 * @param {Kulture[]} kulturesArray the list of kulture objects to seed the Kluster with
 * @throws {Error} Constructor must be called with the new keyword
 * @throws {TypeError} The kultures param must be of type Array
 * @throws {TypeError} The Array must contain valid Kulture objects
 * @throws {Error} The array must not contain Kulture objects with duplicate IDs
 * @todo Convert last 2 Errors to InvalidArgumentException
 */
var Kluster = function Kluster( kulturesArray ) {
  	if ( ! (this instanceof Kluster) )
      throw new Error( "Kluster must be called with the new keyword" );

    if( ! ( kulturesArray instanceof Array ) )
      throw new TypeError( "argument is not an array" );
   
  	this.kultures = {};
    for( k of kulturesArray ) {
      if( !( k instanceof Kulture ) ) {
        debug( "array element not instanceof Kulture -- throwing" );
        throw new TypeError( "All elements in the array must be valid Kulture objects" );
      }
      if( this.kultures.hasOwnProperty( k.Id ) ) {
        debug( "duplicate id found in array: " + k.Id );
        throw new Error( "All IDs in array must be unique. Duplicate: " + k.Id );
      }

      this.kultures[ k.Id ] = k;
    }
}

Kluster.prototype = {

  /**
    * @property {readonly} The actual count of objects stored
   */
  get Count() {
      return Object.keys( this.kultures ).length;
  },

  /**
   * Adds a valid Kulture object to this Kluster. The id must be unique from any currently stored.
   * @param {Kulture} kulture the object to add
   * @returns {Object} with 'success': TRUE|FALSE or 'error': <message>
   * @returns {Object} Error: called without kulture object
   * @returns {Object} Error: called for existing kulture
   */
  AddKulture: function( kulture ) {
    debug( "AddKulture called with " + kulture.toString() + " type: " + typeof kulture );
    debug( "kulture instanceof Kulture = " + (kulture instanceof Kulture));
    if( !( kulture instanceof Kulture ) ) {
      debug( "! kulture instanceof Kulture -- throwing" );
      return { success: false, error: "called without kulture object" };
    }

    if( this.GetById( kulture.Id ) ) {
      debug( "duplicate id found in array: " + kulture.Id );
      return { success: false, error: "called for existing kulture" };
    }

    this.kultures[ kulture.Id ] = kulture;
    return { success: true };
  },

  /**
   * Deletes an existing kulture object from this Kluster
   * @param {string} id the id object to delete
   * @returns {JSON} with 'success': TRUE|FALSE or 'error': <message>
   * Error: called without string argument
   * Error: called for non-existant kulture
   */
  DeleteKultureById: function( id ) {
    debug( "DeleteKulture called with " + id.toString() + " type: " + typeof id );
    if( typeof id !== 'string' ) {
      debug( "! id instanceof string -- throwing" );
      return { success: false, error: "called without string argument" };
    }

    debug( "DeleteKultureById:", JSON.stringify( id ) );
    if( this.kultures.hasOwnProperty( id ) ) {
      debug( "DeleteKultureById found", id );
      delete this.kultures[id];
      return { success: true };
    } else {
      debug( "DeleteKultureById not found", id );
      return { success: false, error: "called for non-existant kulture" };
   }
  },

  /**
   * Retrieves a kulture object from this Kluster based on its ID
   * @param {string} id the id of object to retrieve
   * @returns {Kulture|null} the corresponding object or null if not found
   */
  GetById: function( id ) {
    debug( "GetById: " + JSON.stringify( id ) );
    if( this.kultures.hasOwnProperty( id ) ) {
      debug( "GetById found", id );
      debugger;
      return this.kultures[id];
    } else {
      debug( "id not found", id );
      return null;
    }
  },

  /**
   * Retrieves a kulture object from this Kluster based on its loc
   * @param {string} loc the loc of object to retrieve
   * @returns {Kulture|null} the corresponding object or null if not found
   */
  GetByLoc: function( loc ) {
    debug( "GetByLoc: " + JSON.stringify( loc ) );
    for( id in this.kultures ) {
      //debug( "id:",JSON.stringify( this.kultures[id].display.loc ) );
      if( _.isEqual( this.kultures[id].display.loc, loc ) ) {
        return this.kultures[id];
      }
    }
    debug( "loc not found", loc );
    return null;
  },

  /**
   * Finds the (up to) 6 immediately surrounding tiles
   * @param {string} id the id of the Kulture in the Kluster to find neighbors for
   * @returns {object} references to the surrounding neighbors accessed by their encoded relationship
   */
  GetNeighbors: function( id ) {
    debug( "GetNeighbors: " + JSON.stringify( id ) );
    let result = {};
    let centerLoc = this.GetById( id ).display.loc;
    result['0pm'] = this.GetByLoc( { x: centerLoc.x, y: centerLoc.y + 1, z: centerLoc.z - 1 } );
    result['0mp'] = this.GetByLoc( { x: centerLoc.x, y: centerLoc.y - 1, z: centerLoc.z + 1 } );
    result['p0m'] = this.GetByLoc( { x: centerLoc.x + 1, y: centerLoc.y, z: centerLoc.z - 1 } );
    result['pm0'] = this.GetByLoc( { x: centerLoc.x + 1, y: centerLoc.y - 1, z: centerLoc.z } );
    result['mp0'] = this.GetByLoc( { x: centerLoc.x - 1, y: centerLoc.y + 1, z: centerLoc.z } );
    result['m0p'] = this.GetByLoc( { x: centerLoc.x - 1, y: centerLoc.y, z: centerLoc.z + 1 } );
    return result;
  }
}



/*


*/

module.exports = { Kluster };
