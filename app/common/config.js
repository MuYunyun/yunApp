'use strict'

module.exports = {
	header: {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	},
	backup: {
		avatar: 'http://files.cnblogs.com/files/MuYunyun/pkq.gif'
	},
	qiniu: {
		video: 'http://oh87gl620.bkt.clouddn.com/',
		thumb: 'http://oh87gl620.bkt.clouddn.com/',
		avatar: 'http://oh87gl620.bkt.clouddn.com/',
		upload: 'http://upload.qiniu.com'
	},
	cloudinary: {
		cloud_name: 'yunyun',
		api_key: '437996579139555',
		base: 'http://res.cloudinary.com/yunyun', //基础地址
		image: 'https://api.cloudinary.com/v1_1/yunyun/image/upload', //上传图片地址
		video: 'https://api.cloudinary.com/v1_1/yunyun/video/upload', //上传视频地址
		audio: 'https://api.cloudinary.com/v1_1/yunyun/raw/upload', //上传音频地址
	},
	api: {
		//base: 'http://rap.taobao.org/mockjs/10272/',
		base: 'http://localhost:1234/',
		creations: 'api/creations', // 普通视频接口
		comment: 'api/comments', //评论接口
		up: 'api/up', // 点赞投票接口
		video: 'api/creations/video', //上传视频后，让服务器更新数据
		audio: 'api/creations/audio', //上传音频后，让服务器更新数据
		signup: 'api/u/signup', // 发送验证码接口
		verify: 'api/u/verify', // 登录验证接口
		update: 'api/u/update', // 用户资料更新接口
		signature: 'api/signature' //签名接口
	}
}