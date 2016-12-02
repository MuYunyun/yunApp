/* 合并后的音视频文件 */
'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var CreationSchema = new Schema({
	author: { //作者
		type: ObjectId,
		ref: 'User'
	},

	video: { //用到的视频文件
		type: ObjectId,
		ref: 'Video'
	},

	audio: { //用到的音频文件
		type: ObjectId,
		ref: 'Audio'
	},

	//七牛图床
	qiniu_thumb: String, //七牛上存的封面图
	qiniu_video: String, //七牛上存的合并后的视频

	//cloudinary图床
	cloudinary_thumb: String, //cloudinary上存的封面图的拼接的url地址
	cloudinary_video: String, //cloudinary上存的合并后的视频的拼接的url地址

	finish: { //中间经过了很多异步过程，通过该字段了解加工进度
		type: Number,
		default: 0
	},

	votes: [String], //里面存的是点赞用户的ID
	up: { //点赞次数
		type: Number,
		default: 0
	},

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
CreationSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	} else { // 更新
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Creation', CreationSchema)