'use strict'

var _ = require('lodash');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var Video = mongoose.model('Video');
var Audio = mongoose.model('Audio');
var Creation = mongoose.model('Creation'); //合并后的音视频的模型
var xss = require('xss');
var robot = require('../service/robot');
var config = require('../../config/config');

exports.up = function*(next) { //点赞
	var body = this.request.body;
	var user = this.session.user;
	var creation = yield Creation.findOne({
			_id: body.id
		})
		.exec()

	if (!creation) {
		this.body = {
			success: false,
			err: '视频找不到了！'
		}

		return next
	}

	if (body.up === 'yes') {
		creation.votes.push(String(user._id));
	} else {
		creation.votes = _.without(creation.votes, String(user._id)); //lodash上的方法
	}

	creation.up = creation.votes.length; //该视频点赞的人数

	yield creation.save();

	this.body = {
		success: true
	}
}

var userFields = [
	'avatar',
	'nickname',
	'gender',
	'age',
	'breed'
]

exports.find = function*(next) {
	var page = parseInt(this.query.page, 10) || 1; //默认从第一页开始
	var count = 5; //默认返回的个数
	var offset = (page - 1) * count; //偏移量，从第几条开始查

	var queryArray = [
		Creation
		.find({
			finish: {
				$gte: 70
			} //这里主要是后面异步的原因有时候卡在70
		}) //创意视频进度完成100以后才能继续进行
		.sort({
			'meta.createAt': -1
		})
		.skip(offset) //从第几条开始
		.limit(count) //每次查询的数量
		.populate('author', userFields.join(' ')) //查出该创意视频的作者信息
		.exec(),
		Creation
		.count({
			finish: 100
		}).exec() //创意视频的个数	
	]

	var data = yield queryArray;

	this.body = {
		success: true,
		data: data[0],
		total: data[1]
	}
}

function asyncMedia(videoId, audioId) { //进行视频音频的合并
	if (!videoId) {
		return
	} //确保视频异步上传到cloudnary已经完毕

	console.log(videoId);
	console.log(audioId);
	var query = { //以下几行代码，兼容没有audioId的情况
		_id: audioId
	}

	if (!audioId) { //如果没有直接查到audioId则通过间接查AudioId里面表的字段video来找到audio
		query = {
			video: videoId
		}
	}

	Promise.all([ //app.js里设置了promise的内置库是bluebird
			Video.findOne({
				_id: videoId
			}).exec(),
			Audio.findOne(query).exec()
		])
		.then(function(data) {
			console.log(data);
			var video = data[0];
			var audio = data[1];

			console.log('检查视频有效性');
			if (!video || !video.public_id || !audio || !audio.public_id) {
				return
			}

			console.log('开始合并音频视频');

			var video_public_id = video.public_id; //public_id形式为video/zbewznyajqrvcbng4ckp
			var audio_public_id = audio.public_id.replace(/\//g, ':'); //:转为冒号表示层级关系
			var videoName = video_public_id.replace(/\//g, '_') + '.mp4'; //新命名
			var videoURL = 'http://res.cloudinary.com/yunyun/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' + video_public_id + '.mp4'; //通过url规则把视频和音频拼成一份 e_volume:-100静音
			var thumbName = video_public_id.replace(/\//g, '_') + '.jpg'; //封面图的名字
			var thumbURL = 'http://res.cloudinary.com/yunyun/video/upload/' + video_public_id + '.jpg'; // 封面图地址

			console.log('同步视频到七牛');

			robot
				.saveToQiniu(videoURL, videoName)
				.catch(function(err) {
					console.log(err);
				})
				.then(function(response) {
					if (response && response.key) {
						audio.qiniu_video = response.key;
						audio.save().then(function(_audio) {
							Creation.findOne({ //这里为了兼容创意视频存到数据库的时候的bug
									video: video._id,
									audio: audio._id
								}).exec()
								.then(function(_creation) {
									if (_creation) {
										if (!_creation.qiniu_video) {
											_creation.qiniu_video = _audio.qiniu_video;
											_creation.save();
										}
									}
								})

							console.log(_audio);
							console.log('同步视频成功');
						})
					}
				})

			robot
				.saveToQiniu(thumbURL, thumbName)
				.catch(function(err) {
					console.log(err);
				})
				.then(function(response) {
					if (response && response.key) {
						audio.qiniu_thumb = response.key;
						audio.save().then(function(_audio) {
							Creation.findOne({ //这里为了兼容创意视频存到数据库的时候的bug
									video: video._id,
									audio: audio._id
								}).exec()
								.then(function(_creation) {
									if (_creation) {
										if (!_creation.qiniu_video) {
											_creation.qiniu_thumb = _audio.qiniu_thumb;
											_creation.save();
										}
									}
								})
							console.log(_audio);
							console.log('同步封面图成功');
						})
					}
				})
		})
}

exports.audio = function*(next) { //保存音频到数据库
	var body = this.request.body;
	var audioData = body.audio; // 获取全部audio数据
	var videoId = body.videoId; // 音频里相应的video信息
	var user = this.session.user;

	if (!audioData || !audioData.public_id) {
		this.body = {
			success: false,
			err: '音频没有上传成功！'
		}
		return next
	}

	var audio = yield Audio.findOne({
			public_id: audioData.public_id
		})
		.exec()

	var video = yield Video.findOne({
			_id: videoId
		})
		.exec()

	if (!audio) {
		var _audio = {
			author: user._id, //上传人
			public_id: audioData.public_id,
			detail: audioData
		}

		if (video) { //如果有相应视频Id，把之存入
			_audio.video = video._id;
		}

		audio = new Audio(_audio);
		audio = yield audio.save();
	}

	//异步操作 进行视频音频的合并
	asyncMedia(video._id, audio._id);

	this.body = {
		success: true,
		data: audio._id
	}
}

exports.video = function*(next) { //保存视频并异步上传到cloudinary图床
	var body = this.request.body;
	var videoData = body.video;
	var user = this.session.user;

	if (!videoData || !videoData.key) {
		this.body = {
			success: false,
			err: '视频没有上传成功！'
		}

		return next
	}

	var video = yield Video.findOne({
			qiniu_key: videoData.key
		})
		.exec()

	if (!video) {
		video = new Video({
			author: user._id, //发布人的ID
			qiniu_key: videoData.key,
			persistentId: videoData.persistentId //任务ID
		})

		video = yield video.save();
	}

	var url = config.qiniu.video + video.qiniu_key; //视频的url地址

	robot
		.uploadToCloudinary(url) //上传视频到cloudinary(异步操作)
		.then(function(data) {
			if (data && data.public_id) { //cloudinary会返回一个public_id
				video.public_id = data.public_id;
				video.detail = data;
				video.save().then(function(_video) {
					asyncMedia(_video._id);
				})
			}
		})

	this.body = {
		success: true,
		data: video._id
	}
}

exports.save = function*(next) { //保存合并后的创意视频到数据库
	var body = this.request.body;
	var videoId = body.videoId;
	var audioId = body.audioId;
	var title = body.title;
	var user = this.session.user;

	var video = yield Video.findOne({
		_id: videoId
	}).exec();
	var audio = yield Audio.findOne({
		_id: audioId
	}).exec();

	if (!video || !audio) {
		this.body = {
			success: false,
			err: '音频或者视频素材不能为空'
		}

		return next
	}

	var creation = yield Creation.findOne({
		audio: audioId,
		video: videoId
	}).exec()

	if (!creation) {
		var creationData = {
			author: user._id,
			title: xss(title),
			audio: audioId,
			video: videoId,
			finish: 20 //初始进度值20;
		}

		var video_public_id = video.public_id;
		var audio_public_id = audio.public_id;

		if (video_public_id && audio_public_id) { //两个public_id都有说明已经准备充分
			creationData.cloudinary_thumb = 'http://res.cloudinary.com/yunyun/video/upload/' + video_public_id + '.jpg';
			creationData.cloudinary_video = 'http://res.cloudinary.com/yunyun/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id.replace(/\//g, ':') + '/' + video_public_id + '.mp4';

			creationData.finish += 20; //进度+20
		}

		if (audio.qiniu_thumb) {
			creationData.qiniu_thumb = audio.qiniu_thumb;

			creationData.finish += 30 //进度+30
			console.log('creationData' + 30)
		}

		if (audio.qiniu_video) {
			creationData.qiniu_video = audio.qiniu_video;

			creationData.finish += 30 //进度+30
			console.log('creationData' + 30)
		}

		creation = new Creation(creationData);
	}

	creation = yield creation.save();

	console.log(creation);

	this.body = {
		success: true,
		data: {
			_id: creation._id,
			finish: creation.finish,
			title: creation.title,
			qiniu_thumb: creation.qiniu_thumb,
			qiniu_video: creation.qiniu_video,
			author: {
				avatar: user.avatar,
				nickname: user.nickname,
				gender: user.gender,
				breed: user.breed,
				_id: user._id
			}
		}
	}
}