'use strict'

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	phoneNumber: {
		unique: true, //唯一，每个人的手机号都不一样
		type: String
	},
	areaCode: String, //区号，考虑以后的国际场景
	verifyCode: String, //验证码 speakeasy 生成的首位会为0，所以不用Number类型
	verified: {
		type: Boolean,
		default: false
	},
	accessToken: String, //通过票据判断用户的合法性
	nickname: String, //昵称
	gender: String, //性别
	breed: String, //品种
	age: String, //年龄
	avatar: String, //头像
	meta: {
		createAt: { //创建时间
			type: Date,
			default: Date.now()
		},
		updateAt: { //更新时间
			type: Date,
			default: Date.now()
		}
	}
})

//增加一些存储前的前置处理
UserSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	} else { // 更新
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('User', UserSchema)