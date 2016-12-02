'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var CommentSchema = new Schema({
	creation: {
		type: ObjectId,
		ref: 'Creation'
	}, //每一个评论对应一个创意

	content: String,

	replyBy: { // 回复人
		type: ObjectId,
		ref: 'User'
	},

	replyTo: { // 回复给谁
		type: ObjectId,
		ref: 'User'
	},

	reply: [{
		from: {
			type: ObjectId,
			ref: 'User'
		},
		to: {
			type: ObjectId,
			ref: 'User'
		},
		content: String
	}],

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
CommentSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	} else { // 更新
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Comment', CommentSchema)