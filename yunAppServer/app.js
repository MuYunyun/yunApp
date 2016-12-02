'use strict'

/* 连接数据库 */
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var db = 'mongodb://localhost/yunApp';

mongoose.Promise = require('bluebird'); //用bluebird作为mongoose内置的Promise库
mongoose.connect(db);


// 初始化数据库模型
var models_path = path.join(__dirname, '/app/models'); //__dirname表示当前目录下的层级

var walk = function(modelPath) {
	fs
		.readdirSync(modelPath) //同步读出当前目录下的所有文件
		.forEach(function(file) {
			var filePath = path.join(modelPath, '/' + file)
			var stat = fs.statSync(filePath); //检查该路径状态

			if (stat.isFile()) {
				if (/(.*)\.(js|coffee)/.test(file)) {
					require(filePath)
				}
			} else if (stat.isDirectory()) { // 是嵌套的目录
				walk(filePath) //深度遍历
			}
		})
}

walk(models_path);

var koa = require('koa');
var logger = require('koa-logger'); //日志中间件
var session = require('koa-session'); //会话中间件
var bodyParser = require('koa-bodyparser'); //解析post的数据
var app = koa(); //把koa的实例交给app

app.keys = ['muyunyun']; //会话中间件cookiesession中加密的key
app.use(logger());
app.use(session(app));
app.use(bodyParser());

var router = require('./config/routes')()

app
	.use(router.routes())
	.use(router.allowedMethods()) //固定用法

app.use(function*(next) {
	console.log(this.href);
	console.log(this.method);
	this.body = {
		success: true
	}

	yield next
})

app.listen(1234);
console.log('Listening: 1234');