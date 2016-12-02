# 基于RN开发的一款视频配音APP
-----
APP效果:
-------

<a href="http://oegv7uazl.bkt.clouddn.com/show.gif">☁️动态效果展示☁️</a>

<img src="http://oegv7uazl.bkt.clouddn.com/%E8%BD%AE%E6%92%AD%E5%9B%BE.png" width="33%" height="33%" float"left" height="700" alt="效果展示"/>
&nbsp;<img src="http://oegv7uazl.bkt.clouddn.com/message.jpeg" width="33%" height="33%" float"left" height="700" alt="效果展示"/>
简介:
---------------
**1. APP后端搭建:**
  * 使用NodeJs的`koa`框架完成APP后端的搭建;
  * 使用`mongodb`完成数据存储,通过`mongoose`模块完成对`mongodb`数据的构建;

**2. APP前端搭建:**
  * 使用`RN`组件式架构、JS类库实现快速开发
  * 采用`Flexbox`布局方式
  * 无后台`Mock数据`做本地JSON接口，实现前后端分离开发
  
**3. 一些功能模块:**
  * 启动界面轮播效果的实现;
  * 通过短信验证码登入;
  * 视频的上传以及静音处理;
  * 音频的上传;
  * 视频和音频的整合;  
  * 用户资料的更新；
  * 评论模块
  * 点赞模块

运行环境:
-------
目前该项目在node 6.4版本、react-native 0.37.0版本运行正常；

运行:
----
1. 通过命令`react-native run-ios`启动RN项目
2. 进入yunAppServer，通过命令`node app`启动服务器

待实现的点：
------
* 细节待优化；








