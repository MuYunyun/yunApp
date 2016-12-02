'use strict'

var mongoose = require('mongoose');
var Comment = mongoose.model('Comment'); //评论模型
var Creation = mongoose.model('Creation'); //创意视频模型

var userFields = [
	'avatar',
	'nickname',
	'gender',
	'age',
	'breed'
]

exports.find = function*(next) { //获取评论列表
	var id = this.query.creation;

	if (!id) {
		this.body = {
			success: false,
			err: 'id 不能为空'
		}

		return next
	}

	var queryArray = [
		Comment.find({
			creation: id
		})
		.populate('replyBy', userFields.join(' '))
		.sort({
			'meta.createAt': -1
		})
		.exec(),
		Comment.count({
			creation: id
		}).exec()
	]

	var data = yield queryArray;

	this.body = {
		success: true,
		data: data[0],
		total: data[1]
	}
}

exports.save = function*(next) { //存储
	var commentData = this.request.body.comment;
	var user = this.session.user;
	var creation = yield Creation.findOne({
			_id: commentData.creation
		})
		.exec()

	if (!creation) {
		this.body = {
			success: false,
			err: '视频不见了'
		}

		return next
	}

	var comment;

	if (commentData.cid) { //层叠评论,cid是内容id
		comment = yield Comment.findOne({
				_id: commentData.cid
			})
			.exec()

		var reply = {
			from: commentData.from, //评论来自
			to: commentData.tid, //评论给谁
			content: commentData.content //评论内容
		}

		comment.reply.push(reply);

		comment = yield comment.save();

		this.body = {
			success: true
		}
	} else { //直接回复(非层叠评论)
		comment = new Comment({
			creation: creation._id,
			replyBy: user._id,
			replyTo: creation.author, //视频发布者
			content: commentData.content
		})

		comment = yield comment.save();

		this.body = {
			success: true,
			data: [comment]
		}
	}
}