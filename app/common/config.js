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
		creations: 'api/creations', // 普通视频接口
		comment: 'api/comments', //评论接口
		up: 'api/up', // 点赞投票接口
		signup: 'api/u/signup', // 发送验证码接口
		verify: 'api/u/verify', // 登录验证接口
		update: 'api/u/update', // 用户资料更新接口
		signature: 'api/signature' //签名接口
	}
}