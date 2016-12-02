'use strict'

var mongoose = require('mongoose');
var uuid = require('uuid');
var User = mongoose.model('User');
var robot = require('../service/robot');

exports.signature = function*(next) { //处理签名
	var body = this.request.body;
	var cloud = body.cloud; //请求哪个图床
	var data

	if (cloud === 'qiniu') { //如果有key则是对七牛的签名
		data = robot.getQiniuToken(body);
	} else { //否则是对cloudinary的签名
		data = robot.getCloudinaryToken(body);
	}

	this.body = {
		success: true,
		data: data
	}
}

exports.hasBody = function*(next) { //post传过来的值是否为空
	var body = this.request.body || {};

	if (Object.keys(body).length === 0) {
		this.body = {
			success: false,
			err: '是不是漏掉什么了'
		}

		return next
	}

	yield next
}

exports.hasToken = function*(next) { //检查有没有accessToken
	var accessToken = this.query.accessToken;

	if (!accessToken) {
		accessToken = this.request.body.accessToken;
	}

	if (!accessToken) {
		this.body = {
			success: false,
			err: '钥匙丢了'
		}

		return next
	}

	var user = yield User.findOne({
			accessToken: accessToken
		})
		.exec()

	if (!user) {
		this.body = {
			success: false,
			err: '用户没登录'
		}

		return next
	}

	this.session = this.session || {}
	this.session.user = user

	yield next; // 走向下一个中间件
}