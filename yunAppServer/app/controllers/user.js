'use strict'

var xss = require('xss');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var uuid = require('uuid');
var sms = require('../service/sms');

exports.signup = function*(next) { //用户注册的post过来的手机号
	var phoneNumber = xss(this.request.body.phoneNumber.trim());

	var user = yield User.findOne({
		phoneNumber: phoneNumber
	}).exec()

	var verifyCode = sms.getCode(); //生成验证码

	if (!user) {
		var accessToken = uuid.v4(); //通过uuid生成票据

		user = new User({
			nickname: '小狗宝',
			avatar: 'http://files.cnblogs.com/files/MuYunyun/pkq.gif',
			phoneNumber: xss(phoneNumber), //简单的过滤
			verifyCode: verifyCode,
			accessToken: accessToken
		})
	} else { //已经注册过了，更新验证码
		user.verifyCode = verifyCode
	}

	try {
		user = yield user.save()
	} catch (e) {
		this.body = {
			success: false
		}

		return next
	}

	var msg = '您的注册验证码是：' + user.verifyCode;

	try {
		sms.send(user.phoneNumber, msg); //发送验证码
	} catch (e) {
		console.log(e);

		this.body = {
			success: false,
			err: '短信服务异常'
		}

		return next
	}

	this.body = {
		success: true
	}
}

exports.verify = function*(next) { // 验证用户的验证码
	var verifyCode = this.request.body.verifyCode;
	var phoneNumber = this.request.body.phoneNumber;

	// console.log(verifyCode);
	// console.log(phoneNumber);
	if (!verifyCode || !phoneNumber) { //手机或验证码有为空的情况
		this.body = {
			success: false,
			err: '验证没通过'
		}

		return next
	}

	var user = yield User.findOne({
		phoneNumber: phoneNumber,
		verifyCode: verifyCode
	}).exec();

	if (user) { // 验证通过
		user.verified = true;
		user = yield user.save();

		this.body = {
			success: true,
			data: {
				nickname: user.nickname,
				accessToken: user.accessToken,
				avatar: user.avatar,
				_id: user._id
			}
		}
	} else {
		this.body = {
			success: false,
			err: '验证未通过'
		}
	}
}

exports.update = function*(next) { // 更新用户资料
	var body = this.request.body;
	var user = this.session.user;
	var fields = 'avatar,gender,age,nickname,breed'.split(',');

	fields.forEach(function(field) {
		if (body[field]) {
			user[field] = xss(body[field].trim()); //去掉前后空格  
		}
	})

	user = yield user.save();

	this.body = {
		success: true,
		data: {
			nickname: user.nickname,
			accessToken: user.accessToken,
			avatar: user.avatar,
			age: user.age,
			breed: user.breed,
			gender: user.gender,
			_id: user._id
		}
	}
}