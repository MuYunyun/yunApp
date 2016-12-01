/* 常用的工具方法 */
'use strict'

var config = require('./config');

exports.thumb = function(key) { //显示视频缩略图
	if (key.indexOf('http') > -1) return key

	return config.qiniu.thumb + key
}

exports.avatar = function(key) { //显示用户头像
	if (!key) {
		return config.backup.avatar
	}

	if (key.indexOf('http') > -1) return key

	if (key.indexOf('data:image') > -1) return key

	if (key.indexOf('avatar/') > -1) { //兼容cloudinary图床
		return config.cloudinary.base + '/image/upload/' + key
	}

	return config.qiniu.avatar + key
}

exports.video = function(key) { //视频地址
	if (key.indexOf('http') > -1) return key

	if (key.indexOf('video/') > -1) { //兼容cloudinary图床
		return config.cloudinary.base + '/video/upload/' + key
	}

	return config.qiniu.video + key
}