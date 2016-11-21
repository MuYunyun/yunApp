'use strict'

module.exports = {
	header: {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	},
	api: {
		base: 'http://rap.taobao.org/mockjs/10272/',
		creations: 'api/creations',
		comment: 'api/comments',
		up: 'api/up'
	}
}