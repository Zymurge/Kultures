var Kulture = require( './kulture_data' ).Kulture;
var _ = require( 'underscore' );
var debug = require('debug')('kluster:core');

/**
 * Represents a cluster of kulture objects.
 * @constructor
 * @param {array} kultures - the list of kulture objects to see the Kluster with
 */
var Kluster = function Kluster( kultures ) {
  	if ( ! (this instanceof Kluster) )
      throw new Error( "Kluster must be called with the new keyword" );

    if( ! (kultures instanceof Array) )
      throw new TypeError( "argument is not an array" );
   
  	this.kultures = kultures;
}

Kluster.prototype = {

  /**
   * The number of kulture objects in this Kluster
   * @property The actual count of objects stored
   */
  get Count() {
      return this.kultures.length;
  },

  /**
   * Adds a valid kulture object to this Kluster
   * @param {Kulture} kulture - the object to add
   * @returns {JSON} with 'success': TRUE|FALSE or 'error': <message>
   * Error: called without kulture object
   * Error: called for existing kulture
   */
  AddKulture: function( kulture ) {
    debug( "AddKulture called with " + kulture.toString() + " type: " + typeof kulture );
    debug( "kulture instanceof Kulture = " + (kulture instanceof Kulture));
    if( !( kulture instanceof Kulture ) ) {
      debug( "! kulture instanceof Kulture -- throwing" );
      return { success: false, error: "called without kulture object" };
    }

    if( this.GetById( kulture.ref.id ) ) {
      debug( "duplicate id found in array: " + kulture.ref.id );
      return { success: false, error: "called for existing kulture" };
    }

    let prepushCount = this.Count;
    debug( "prepushCount", prepushCount );
    let result = this.kultures.push( kulture );
    return { success: result == prepushCount + 1 };
  },

  /**
   * Deletes an existing kulture object from this Kluster
   * @param {string} id - the id object to delete
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

    let prepushCount = this.Count;
    for( var i=0; i < this.kultures.length; i++ ) {
      if( this.kultures[i].ref.id === id ) {
        debug( "length before splice: " + this.Count );
        this.kultures.splice( i, 1 );
        debug( "length after splice: " + this.Count );
        return { success: this.Count == prepushCount - 1 };
      }
    }

    debug( "id not found for deletion" );
    return { success: false, error: "called for non-existant kulture" };
  },

  /**
   * Retrieves a kulture object from this Kluster based on its ID
   * @param {string} id - the id of object to retrieve
   * @returns {Kulture} the corresponding object or null if not found
   */
  GetById: function( id ) {
    debug( "GetById: " + JSON.stringify( id ) );
    for( var i=0; i < this.kultures.length; i++ ) {
      if( this.kultures[i].ref.id === id ) {
        return this.kultures[i];
      }
    }
    debug( "id not found", id );
    return null;
  },

  /**
   * Retrieves a kulture object from this Kluster based on its loc
   * @param {string} loc - the loc of object to retrieve
   * @returns {Kulture} the corresponding object or null if not found
   */
  GetByLoc: function( loc ) {
    debug( "GetByLoc: " + JSON.stringify( loc ) );
    for( var i=0; i < this.kultures.length; i++ ) {
      //debug( "k" + i + ": " + JSON.stringify( this.kultures[i].display.loc ) );
      if( _.isEqual( this.kultures[i].display.loc, loc ) ) {
        return this.kultures[i];
      }
    }
    debug( "loc not found", loc );
    return null;
  }


}

/*


*/

module.exports = { Kluster };
