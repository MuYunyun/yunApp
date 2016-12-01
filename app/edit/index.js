/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// ES5
var _ = require('lodash');
var React = require('react');
var ReactNative = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
var Video = require('react-native-video').default; //视频组件
var ImagePicker = require('react-native-image-picker'); // 弹出相册或拍照
var Button = require('react-native-button');

var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var TouchableOpacity = ReactNative.TouchableOpacity;
var Image = ReactNative.Image;
var AlertIOS = ReactNative.AlertIOS;
var AsyncStorage = ReactNative.AsyncStorage;
var ProgressViewIOS = ReactNative.ProgressViewIOS;
import {
	CountDownText
} from 'react-native-sk-countdown'; //倒计时模块
var Progress = require('react-native-progress'); // 上传进度组件
var RNAudio = require('react-native-audio'); //录音模块
var AudioRecorder = RNAudio.AudioRecorder;
var AudioUtils = RNAudio.AudioUtils;

var request = require('../common/request');
var config = require('../common/config');

var Dimensions = ReactNative.Dimensions; //获取可视区宽度的模块
var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;
var Modal = ReactNative.Modal; //发布视频模态层
var TextInput = ReactNative.TextInput;


var videoOptions = { // react-native-image-picker文档里的一些配置
	title: '选择视频',
	cancelButtonTitle: '取消',
	takePhotoButtonTitle: '录制 10 秒视频',
	chooseFromLibraryButtonTitle: '选择已有视频',
	videoQuality: 'medium', //中等质量
	mediaType: 'video',
	durationLimit: 10, //录制的时候控制的秒数
	noData: false, //允许转化为64位
	storageOptions: {
		skipBackup: true,
		path: 'images'
	}
};

var defaultState = {
	previewVideo: null, //没有选择视频的状态

	videoId: null, //传给音频的数据库中
	audioId: null,

	title: '',
	modalVisible: false,
	publishing: false, //发布的状态
	willPublish: false, //将要发布
	publishProgress: 0.1,

	// video upload
	video: null, //用来存储上传到七牛后返回的数据
	videoUploaded: false, //上传结束
	videoUploading: false, //正在上传中
	videoUploadedProgress: 0.14,

	// video loads
	videoProgress: 0.01, // 进度条占宽度的初始比例
	videoTotal: 0, //视频总时间
	currentTime: 0, //当前时间

	// 倒计时
	counting: false,
	recording: false,

	// audio
	audio: null,
	audioPlaying: false, // 音频在播放
	recordDone: false, // 录制结束
	audioPath: AudioUtils.DocumentDirectoryPath + '/yun.aac', //本地存放音频地址

	audioUploaded: false, //上传结束
	audioUploading: false, //正在上传中
	audioUploadedProgress: 0.14,

	// 视频控制类
	rate: 1,
	muted: true, //是否静音
	resizeMode: 'contain', //包含 还有cover
	repeat: false
};

var Edit = React.createClass({
	getInitialState() {
		var user = this.props.user || {};
		var state = _.clone(defaultState);

		state.user = user;
		return state
	},

	_onLoadStart() {
		console.log('load start');
	},

	_onLoad() {
		console.log('loads');
	},

	_onProgress(data) {
		var duration = data.playableDuration; // 总共时长
		var currentTime = data.currentTime; // 当前时长
		var percent = Number((currentTime / duration).toFixed(2));

		this.setState({
			videoTotal: duration,
			currentTime: Number(data.currentTime.toFixed(2)),
			videoProgress: percent
		}); //修改播放状态
	},

	_onEnd() {
		if (this.state.recording) { //加上这句是因为第一次视频播放也会触发onEnd
			AudioRecorder.stopRecording(); //录制结束

			this.setState({
				videoProgress: 1,
				recordDone: true, //录制结束
				recording: false //结束录制
			})
		}
	},

	_onError(e) {
		console.log('出错了');
		console.log(e);
		console.log('error');
	},

	_record() { // 开始录音
		this.setState({
			videoProgress: 0, //每次录制进度条都是从0开始
			counting: false,
			recordDone: false, //没录制完成
			recording: true
		})

		AudioRecorder.startRecording(); //开始录制
		this.refs.videoPlayer.seek(0); //视频也重头开始
	},

	_preview() { //预览
		if (this.state.audioPlaying) { //音频正在播放
			AudioRecorder.stopPlaying(); //音频停止播放
		}

		this.setState({
			videoProgress: 0,
			audioPlaying: true
		})

		AudioRecorder.playRecording(); //音频开始播放
		this.refs.videoPlayer.seek(0); //视频也重新开始播放
	},

	_counting() { // 启动倒计时
		if (!this.state.counting && !this.state.recording && !this.state.audioPlaying) { //已经倒计时正在录制正在播放再点击不会出现倒计时
			this.setState({
				counting: true
			})

			this.refs.videoPlayer.seek(this.state.videoTotal - 0.01); //如果视频比较大，倒计时的时候视频还在播放，这时让视频到最后的几毫秒
		}
	},

	_getToken(body) { //获取票据
		var signatureURL = config.api.base + config.api.signature;

		body.accessToken = this.state.user.accessToken;

		return request.post(signatureURL, body)
	},

	_upload(body, type) { // 异步请求
		var that = this;
		var xhr = new XMLHttpRequest();
		var url = config.qiniu.upload;

		if (type === 'audio') {
			url = config.cloudinary.video; //上传到cloudinary
		}

		var state = {};

		state[type + 'UploadedProgress'] = 0
		state[type + 'Uploading'] = true //正在上传中
		state[type + 'Uploaded'] = false //上传结束

		this.setState(state);

		xhr.open('POST', url);
		xhr.onload = () => { //监听
			if (xhr.status !== 200) {
				AlertIOS.alert('请求失败')
				console.log(xhr.responseText)

				return
			}

			if (!xhr.responseText) { //返回的值是空的
				AlertIOS.alert('请求失败');

				return
			}

			var response

			try {
				response = JSON.parse(xhr.response); //解析为对象
			} catch (e) {
				console.log(e);
				console.log('parse fails');
			}

			console.log(response);

			if (response) {
				var newState = {};
				newState[type] = response;
				newState[type + 'Uploading'] = false; //设置上传状态结束
				newState[type + 'Uploaded'] = true; //上传完成

				that.setState(newState);

				var updateURL = config.api.base + config.api[type];
				var accessToken = this.state.user.accessToken;
				var updateBody = {
					accessToken: accessToken
				}
				updateBody[type] = response;

				if (type === 'audio') { //如果是音频类型，把状态里的videoId传递到后台
					updateBody.videoId = that.state.videoId;
				}

				request
					.post(updateURL, updateBody) //传到后台服务器端，让其同步消息数据
					.catch((err) => {
						console.log(err)
						if (type === 'video') {
							AlertIOS.alert('视频同步出错，请重新上传！')
						} else if (type === 'audio') {
							AlertIOS.alert('音频同步出错，请重新上传！')
						}
					})
					.then((data) => {
						if (data && data.success) {
							var mediaState = {};

							mediaState[type + 'Id'] = data.data;

							if (type === 'audio') {
								that._showModal();
								mediaState.willPublish = true
							}

							that.setState(mediaState); //state状态里就有videoid了
						} else {
							if (type === 'video') {
								AlertIOS.alert('视频同步出错，请重新上传！')
							} else if (type === 'audio') {
								AlertIOS.alert('音频同步出错，请重新上传！')
							}
						}

					})
			}
		}

		if (xhr.upload) { //这里都是原生方法
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					var percent = Number((event.loaded / event.total).toFixed(2))

					var progressState = {};

					progressState[type + 'UploadedProgress'] = percent;
					that.setState(progressState);
				}
			}
		}

		xhr.send(body);
	},

	_pickVideo() { //上传视频
		var that = this;

		ImagePicker.showImagePicker(videoOptions, (res) => {
			if (res.didCancel) { // 用户取消选图的操作
				return
			}

			var state = _.clone(defaultState); //选视频后重置所有状态
			var uri = res.uri;

			state.previewVideo = uri;
			state.user = this.state.user;
			that.setState(state);

			that._getToken({
					type: 'video', //传向后台
					cloud: 'qiniu' //请求七牛
				})
				.catch((err) => {
					console.log(err);
					AlertIOS.alert('上传出错');
				})
				.then((data) => {
					if (data && data.success) {
						var token = data.data.token;
						var key = data.data.key;
						var body = new FormData(); //发起表单请求

						body.append('token', token); //签名值
						body.append('key', key);
						body.append('file', {
							type: 'video/mp4',
							uri: uri,
							name: key
						});

						that._upload(body, 'video'); //异步提交
					}
				})
		})
	},

	_uploadAudio() { // 上传音频到cloudinary
		var that = this;
		var tags = 'app,audio';
		var folder = 'audio';
		var timestamp = Date.now();

		this._getToken({
				type: 'audio',
				timestamp: timestamp,
				cloud: 'cloudinary'
			})
			.catch((err) => {
				console.log(err);
			})
			.then((data) => {
				if (data && data.success) {
					var signature = data.data.token;
					var key = data.data.key;
					var body = new FormData(); //发起表单请求

					body.append('folder', folder);
					body.append('signature', signature); //签名值
					body.append('tags', tags);
					body.append('timestamp', timestamp);
					body.append('api_key', config.cloudinary.api_key);
					body.append('resource_type', 'video'); //多媒体类型
					body.append('file', {
						type: 'video/mp4',
						uri: that.state.audioPath,
						name: key
					});

					that._upload(body, 'audio'); //异步提交
				}
			})
	},

	_initAudio() { // 初始化音频
		var audioPath = this.state.audioPath; //本地音频地址

		AudioRecorder.prepareRecordingAtPath(audioPath, {
			SampleRate: 22050,
			Channels: 1,
			AudioQuality: "Low",
			AudioEncoding: "aac"
		});

		AudioRecorder.onProgress = (data) => {
			this.setState({
				currentTime: Math.floor(data.currentTime)
			});
		};
		AudioRecorder.onFinished = (data) => {
			this.setState({
				finished: data.finished
			});
			console.log(`Finished recording: ${data.finished}`);
		};
	},

	_closeModal() {
		this.setState({
			modalVisible: false
		})
	},

	_showModal() {
		this.setState({
			modalVisible: true
		})
	},

	componentDidMount() { //获取
		var that = this;

		AsyncStorage.getItem('user')
			.then((data) => {
				var user

				if (data) {
					user = JSON.parse(data)
				}

				if (user && user.accessToken) {
					that.setState({
						user: user
					})
				}
			})

		this._initAudio(); //初始化音频	
	},

	_submit() { //把合并后的视频以及视频title传到后台
		var that = this;
		var body = {
			title: this.state.title, //视频的名称
			videoId: this.state.videoId,
			audioId: this.state.audioId
		}

		var creationURL = config.api.base + config.api.creations;
		var user = this.state.user;

		if (user && user.accessToken) {
			body.accessToken = user.accessToken;

			this.setState({
				publishing: true
			})

			request
				.post(creationURL, body)
				.catch((err) => {
					console.log(err);
					AlertIOS.alert('视频发布失败');
				})
				.then((data) => {
					console.log(data);
					if (data && data.success) {
						that._closeModal();
						AlertIOS.alert('视频发布成功');
						var state = _.clone(defaultState);
						that.setState(state);
					} else {
						this.setState({ //能重新发布视频
							publishing: false
						})
						AlertIOS.alert('视频发布失败');
					}
				})
		}
	},

	render() {
		return (
			<View style={styles.container}>
		        <View style={styles.toolbar}>
					<Text style={styles.toolbarTitle}>
						{this.state.previewVideo ? '点击按钮配音' : '上传视频'}
					</Text>
					{
						this.state.previewVideo && this.state.videoUploaded  //选择视频后并加载完成
						? <Text style={styles.toolbarExtra} onPress={this._pickVideo}>更换视频</Text>
						: null
					}
				</View>

				<View style={styles.page}>
					{
						this.state.previewVideo     // 操作视频配音界面 || 上传视频界面
						? <View style={styles.videoContainer}>
							<View style={styles.videoBox}>
								<Video
					        		ref='videoPlayer'   //相当于对这个组件的引用
					        		source={{uri: this.state.previewVideo}} //视频文件的URI
					        		style={styles.video}
					        		volumn={1}  //声音放大倍数
					        		paused={this.state.paused}   //是否暂停
					        		rate={this.state.rate} //0 为暂停，1为播放
					        		muted={this.state.muted}  //true为静音
					        		resizeMode={this.state.resizeMode} //视频的拉伸方式(充满整个播放区域还是自适应)
					        		repeat={this.state.repeat}  //是否重复

					        		onLoadStart={this._onLoadStart}  //视频刚开始加载的时候的调用
					        		onLoad={this._onLoad}      // 视频加载时会不断调用
					        		onProgress={this._onProgress}  //视频播放的时候每隔250毫秒调用时间，并带上当前播放时间作为参数
					        		onEnd={this._onEnd}
					        		onError={this._onError} />
					        	{
					        		!this.state.videoUploaded && this.state.videoUploading 
					        		? <View style={styles.progressTipBox}>
					        			<ProgressViewIOS style={styles.progressBar} progressTintColor='#ee735c' progress={this.state.videoUploadedProgress} />
					        			<Text style={styles.progressTip}>
					        				正在生成静音视频，已完成{(this.state.videoUploadedProgress * 100).toFixed(2)}%
					        			</Text>
					        		</View>
					        		: null
					        	}

					        	{
					        		this.state.recording || this.state.audioPlaying //如果开始录制声音或者音频在播放的时候，开始出现进度条
					        		? <View style={styles.progressTipBox}>
					        			<ProgressViewIOS style={styles.progressBar} progressTintColor='#ee735c' progress={this.state.videoProgress} />
					        			{
					        				this.state.recording
					        				? <Text style={styles.progressTip}>
					        					录制声音中
					        				  </Text>
					        				: null
					        			}
					        			
					        		</View>
					        		: null
					        	}

					        	{
					        		this.state.recordDone    //录制结束可以预览
					        		? <View style={styles.previewBox}>
					        			<Icon name='ios-play' style={styles.previewIcon} />
					        			<Text style={styles.previewText} onPress={this._preview}>
					        				预览
					        			</Text>
					        		</View>
					        		: null
					        	}	
							</View>
						</View>
						: <TouchableOpacity style={styles.uploadContainer} onPress={this._pickVideo}>
							<View style={styles.uploadBox}>
								<Image source={require('../assets/images/video.png')} style={styles.uploadIcon} />
								<Text style={styles.uploadTitle}>点我上传视频</Text>
								<Text style={styles.uploadDesc}>建议时长不超过20秒</Text>
							</View>
						</TouchableOpacity>
					}

					{
						this.state.videoUploaded
						?<View style={styles.recordBox}>
							<View style={[styles.recordIconBox, (this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
								{
									this.state.counting && !this.state.recording //倒计时还没进入录制状态
									? <CountDownText
										  style={styles.countBtn}
										  countType='seconds' // 计时类型：seconds / date
							              auto={true} // 自动开始
							              afterEnd={this._record} // 开始录音
							              timeLeft={3} // 正向计时 时间起点为0秒
							              step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
							              startText='准备录制' // 开始的文本
							              endText='Go' // 结束的文本
							              intervalText={(sec) => {
							            	  return sec === 0 ? 'Go' : sec	
							              }} // 定时的文本回调
							            />
							        : <TouchableOpacity onPress={this._counting}>
							        	<Icon name='ios-mic' style={styles.recordIcon} />
							        </TouchableOpacity> 							        
								}
							</View>
						</View>
						: null
					}

					{
						this.state.videoUploaded && this.state.recordDone  //视频上传结束音频录制结束
						? <View style={styles.uploadAudioBox}>
							{	
								!this.state.audioUploaded && !this.state.audioUploading
								? <Text style={styles.uploadAudioText} onPress={this._uploadAudio}>下一步</Text>
								: null
							}

							{
								this.state.audioUploading   //音频正在上传
								? <Progress.Circle   
									showsText={true} //是否显示文本
									size={60} 
									color={'#ee735c'}
									progress = {
										this.state.audioUploadedProgress
									}
								/>
								: null
							}
						</View>
						: null
					}
				</View>

				<Modal
					animationType={"slide"}
					visible={this.state.modalVisible}>
					<View style={styles.modalContainer}>
						<Icon
							name='ios-close-outline'
							onPress={this._closeModal}
							style={styles.closeIcon} />
						{
							this.state.audioUploaded && !this.state.publishing //音频上传完了 还未发布
							? <View style={styles.fieldBox}>
								<TextInput
									placeholder={'输入视频的名称'}
									style={styles.inputField}
									autoCapitalize={'none'}
									autoCorrect={false}
									defaultValue={this.state.title}
									onChangeText={(text) => {  //文本发生改变时,text动态地传递
										this.setState({
											title: text
										})
									}}
								/>
							  </View>
							: null
						}

						{
							this.state.publishing  //正在发布
							? <View style={styles.loadingBox}>
								<Text style={styles.loadingText}>耐心等一下，拼命为您生成专属视频中...</Text>
								{
									this.state.willPublish    //这几段都是营造氛围，给用户不断加载的心里安慰
									? <Text style={styles.loadingText}>正在合并视频音频...</Text>
									: null
								}
								{
									this.state.publishProgress > 0.3
									? <Text style={styles.loadingText}>正在上传喽！...</Text>
									: null
								}
								<Progress.Circle   
									showsText={true} //是否显示文本
									size={60} 
									color={'#ee735c'}
									progress = {this.state.publishProgress} />
							  </View>
							: null
						}	

						<View style={styles.submitBox}>
							{
								this.state.audioUploaded && !this.state.publishing //音频上传完了 还没发布
								? <Button
								  style={styles.btn}
								  onPress={this._submit}>发布视频</Button>
								: null  
							}
						</View>		
					</View>
				</Modal>

		    </View>
		)
	}
})

var styles = StyleSheet.create({
	container: {
		flex: 1
	},

	toolbar: {
		flexDirection: 'row',
		paddingTop: 25,
		paddingBottom: 12,
		backgroundColor: '#ee735c'
	},

	toolbarTitle: {
		flex: 1,
		fontSize: 16,
		color: '#fff',
		textAlign: 'center',
		fontWeight: '600'
	},

	toolbarExtra: {
		position: 'absolute',
		right: 10,
		top: 26,
		color: '#fff',
		textAlign: 'right',
		fontWeight: '600',
		fontSize: 14
	},

	page: {
		flex: 1,
		alignItems: 'center'
	},

	/* 上传视频模块 */
	uploadContainer: {
		marginTop: 90,
		width: width - 40,
		paddingBottom: 10,
		borderWidth: 1,
		borderColor: '#ee735c',
		justifyContent: 'center',
		borderRadius: 6,
		backgroundColor: '#fff'
	},

	uploadTitle: {
		marginBottom: 10,
		textAlign: 'center',
		fontSize: 16,
		color: '#000'
	},

	uploadDesc: {
		color: '#999',
		textAlign: 'center',
		fontSize: 12
	},

	uploadIcon: {
		marginTop: 10,
		marginBottom: 10,
		width: 75,
		height: 100,
		resizeMode: 'contain' //整个包含
	},

	uploadBox: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},

	/* 视频播放模块 */
	videoContainer: {
		width: width,
		justifyContent: 'center',
		alignItems: 'flex-start'
	},

	videoBox: {
		width: width,
		height: height * 0.6
	},

	video: {
		width: width,
		height: height * 0.6,
		backgroundColor: '#333'
	},

	/* 进度条样式 */
	progressTipBox: {
		position: 'absolute',
		left: 0,
		bottom: 0,
		width: width,
		height: 30,
		backgroundColor: 'rgba(244,244,244,0.65)'
	},

	progressTip: {
		color: '#333',
		width: width - 10,
		padding: 5
	},

	progressBar: {
		width: width
	},

	/* 录制音频的按钮以及倒计时 */
	recordBox: {
		width: width,
		height: 60,
		alignItems: 'center'
	},

	recordIconBox: {
		width: 68,
		height: 68,
		marginTop: -30,
		borderRadius: 34,
		backgroundColor: '#ee735c',
		borderWidth: 1,
		borderColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center'
	},

	recordIcon: {
		fontSize: 58,
		backgroundColor: 'transparent',
		color: '#fff'
	},

	countBtn: {
		fontSize: 32,
		fontWeight: '600',
		color: '#fff'
	},

	recordOn: { // 在录制状态时，背景变化 
		backgroundColor: '#ccc'
	},

	previewBox: { //预览
		width: 80,
		height: 30,
		position: 'absolute',
		right: 10,
		bottom: 10,
		borderWidth: 1,
		borderColor: '#ee735c',
		borderRadius: 3,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},

	previewIcon: {
		marginRight: 5,
		fontSize: 20,
		color: '#ee735c',
		backgroundColor: 'transparent'
	},

	previewText: {
		fontSize: 20,
		color: '#ee735c',
		backgroundColor: 'transparent'
	},

	/* 上传音频样式 */
	uploadAudioBox: {
		width: width,
		height: 60,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},

	uploadAudioText: {
		width: width - 20,
		padding: 5,
		borderWidth: 1,
		borderColor: '#ee735c',
		borderRadius: 5,
		textAlign: 'center',
		fontSize: 30,
		color: '#ee735c'
	},

	/* 模态窗 */
	modalContainer: { //浮层样式
		width: width,
		height: height,
		paddingTop: 50,
		backgroundColor: '#fff'
	},

	closeIcon: { // 关闭按钮
		position: 'absolute',
		fontSize: 32,
		right: 20,
		top: 30,
		color: '#ee735c'
	},

	loadingBox: {
		flex: 1,
		width: width,
		height: 50,
		marginTop: 10,
		padding: 15,
		alignItems: 'center'
	},

	loadingText: {
		marginBottom: 10,
		textAlign: 'center',
		color: '#333'
	},

	fieldBox: {
		width: width - 40,
		height: 36,
		marginTop: 30,
		marginLeft: 20,
		marginRight: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#eaeaea',
	},

	inputField: {
		height: 36,
		textAlign: 'center',
		color: '#666',
		fontSize: 14
	},

	submitBox: {
		marginTop: 120,
		padding: 15
	},

	btn: {
		marginTop: -65,
		padding: 10,
		marginLeft: 10,
		marginRight: 10,
		backgroundColor: 'transparent',
		borderColor: '#ee735c',
		textAlign: 'center',
		borderWidth: 1,
		borderRadius: 4,
		color: '#ee735c'
	}
});

module.exports = Edit;