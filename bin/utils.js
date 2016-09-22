module.exports = {
	GenerateErrorJSON: function( id, api, message ) {
		var result = {
		   error: {
		        id: id,
		        api: api,
		        message: message
		    }
		}
		return result;
	}

} // end exports