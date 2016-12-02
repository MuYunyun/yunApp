'use strict'

var qiniu = require('qiniu');
var cloudinary = require('cloudinary');
var Promise = require('bluebird');
var sha1 = require('sha1');
var uuid = require('uuid');
var config = require('../../config/config');

qiniu.conf.ACCESS_KEY = config.qiniu.AK;
qiniu.conf.SECRET_KEY = config.qiniu.SK;

cloudinary.config(config.cloudinary); //配置cloudinary

//构建上传策略函数
exports.getQiniuToken = function(body) { //获得七牛的票据
	var type = body.type; //拿到上传的种类
	var key = uuid.v4();
	var putPolicy;
	var options = {
		persistentNotifyUrl: config.notify //对于视频和音频需要转码，需要这个地址
	}

	if (type === 'avatar') {
		// putPolicy.callbackUrl = 'http://your.domain.com/callback';
		// putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)';
		key += '.jpeg';
		putPolicy = new qiniu.rs.PutPolicy('yunapp:' + key)
	} else if (type === 'video') {
		key += '.mp4';
		options.scope = 'yunapp:' + key; // 视频存储空间
		options.persistentOps = 'avthumb/mp4/an/1'; //转为静音格式
		putPolicy = new qiniu.rs.PutPolicy2(options);
	} else if (type === 'audio') {
		//
	}

	var token = putPolicy.token();

	return {
		key: key,
		token: token
	}
}

exports.saveToQiniu = function(url, key) { // 把cloudinary的数据同步到七牛图床
	var client = new qiniu.rs.Client();

	return new Promise(function(resolve, reject) {
		client.fetch(url, 'yunapp', key, function(err, ret) {
			if (!err) {
				resolve(ret);
			} else {
				reject(err);
			}
		})
	})
}

exports.uploadToCloudinary = function(url) { //上传视频到cloudinary(异步操作)
	return new Promise(function(resolve, reject) {
		cloudinary.uploader.upload(url, function(result) {
			if (result && result.public_id) {
				resolve(result); //把拿到的JSON对象返回
			} else {
				reject(result);
			}
		}, {
			resource_type: 'video', //指定类型
			folder: 'video' //上传到哪个文件夹下
		})
	})
}

exports.getCloudinaryToken = function(body) { //获得cloudinary的票据
	var type = body.type;
	var timestamp = body.timestamp;
	var folder
	var tags

	if (type === 'avatar') {
		folder = 'avatar' //要传到图床下哪个文件下面
		tags = 'app,avatar' //对要上传的图片加个Tag
	} else if (type === 'video') {
		folder = 'video'
		tags = 'app,video'
	} else if (type === 'audio') {
		folder = 'audio'
		tags = 'app,audio'
	}

	var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.cloudinary.api_secret;
	var key = uuid.v4();

	signature = sha1(signature);

	return {
		token: signature,
		key: key
	}
}