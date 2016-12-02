'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var VideoSchema = new Schema({
	author: { //作者
		type: ObjectId,
		ref: 'User'
	},

	//七牛图床
	qiniu_key: String, //七牛上的key
	persistentId: String, //任务Id
	qiniu_final_key: String, //经过转码以后获得的静音的时候的Key
	qiniu_default: Mixed, //混合类型（数组、字符串）

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
VideoSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	} else { // 更新
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Video', VideoSchema)