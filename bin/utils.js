module.exports = {
    /**
     * Generates a standardized error payload object
     * @param {string} api - the calling API. Defaults to 'unspecified'
     * @param {string} id -  the specified kulture ID if applicable. Defaults to 'none'
     * @param {string} message - the error message. Defaults ''
     * @returns {Object} the error payload
     */
    GenerateErrorJSON: function (api='unspecified', id='none', message='' ) {
		var result = {
		        api: api != null ? api : 'unspecified',
                id: id != null ? id : 'none',
                message: message != null ? message : ''
		}
		return result;
	}

} // end exports