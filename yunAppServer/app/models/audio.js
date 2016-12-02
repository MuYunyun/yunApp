'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var AudioSchema = new Schema({
	author: { //作者
		type: ObjectId,
		ref: 'User'
	},

	video: { //每个音频对应的视频
		type: ObjectId,
		ref: 'Video'
	},

	qiniu_video: String, //视频地址 同步视频音频加上去的
	qiniu_thumb: String, //缩略图

	//cloudinary图床
	public_id: String,
	detail: Mixed,

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
AudioSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	} else { // 更新
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Audio', AudioSchema)