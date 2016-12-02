'use strict'

var queryString = require('query-string'); //对参数拼接的模块
var _ = require('lodash'); //对象的替换
//var Mock = require('mockjs'); // 伪造数据模块
var config = require('./config');

var request = {};

request.get = function(url, params) {
	if (params) {
		url += '?' + queryString.stringify(params)
	}

	return fetch(url)
		.then((response) => response.json())
		//.then((response) => Mock.mock(response))
}

request.post = function(url, body) {
	var options = _.extend(config.header, {
		body: JSON.stringify(body)
	})

	return fetch(url, options)
		.then((response) => response.json())
		//.then((response) => Mock.mock(response))
}

module.exports = request;