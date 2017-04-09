module.exports = {
    GenerateErrorJSON: function (api, id, message ) {
		var result = {
		   //error: {
		        api: api,
		        id: id,
		        message: message
		   // }
		}
		return result;
	}

} // end exports