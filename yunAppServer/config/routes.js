'use strict'

var Router = require('koa-router');
var User = require('../app/controllers/user');
var App = require('../app/controllers/app');
var Creation = require('../app/controllers/creation'); //保存创意视频到数据库方法
var Comment = require('../app/controllers/comment');


module.exports = function() {
	var router = new Router({
		prefix: '/api' //前缀
	})

	/* user */
	router.post('/u/signup', App.hasBody, User.signup); // 用户注册的post过来的手机号
	router.post('/u/verify', App.hasBody, User.verify); // 验证用户的验证码
	router.post('/u/update', App.hasBody, App.hasToken, User.update); // 更新用户资料

	/* app */
	router.post('/signature', App.hasBody, App.hasToken, App.signature); //处理签名

	/* creations */
	router.get('/creations', App.hasToken, Creation.find); //查找创意视频
	router.post('/creations', App.hasBody, App.hasToken, Creation.save); //前台上传提交合并视频音频的标题
	router.post('/creations/video', App.hasBody, App.hasToken, Creation.video); //前台上传视频后，让服务器更新数据
	router.post('/creations/audio', App.hasBody, App.hasToken, Creation.audio); //前台上传音频后，让服务器更新数据

	/* comments */
	router.get('/comments', App.hasToken, Comment.find); //查找评论列表
	router.post('/comments', App.hasBody, App.hasToken, Comment.save);

	/* 点赞 */
	router.post('/up', App.hasBody, App.hasToken, Creation.up);

	return router;
}