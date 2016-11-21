/**
 * Sample React Native App
 * https: //github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react');
var ReactNative = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
var Video = require('react-native-video').default; //视频组件
var Button = require('react-native-button'); // 按钮组件
var request = require('../common/request');
var config = require('../common/config');

var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var TouchableOpacity = ReactNative.TouchableOpacity;
var Dimensions = ReactNative.Dimensions; //获取可视区宽度的模块
var ListView = ReactNative.ListView;
var Image = ReactNative.Image; //引人图片
var Modal = ReactNative.Modal; //浮出评论弹框
var AlertIOS = ReactNative.AlertIOS; //浮出评论弹框
var ActivityIndicator = ReactNative.ActivityIndicator; //加载的动画
var TextInput = ReactNative.TextInput; //评论输入框

var width = Dimensions.get('window').width;

var cachedResults = { //缓存列表中的数据
	nextPage: 1, //下一页(默认为1)
	items: [], //缓存的数据列表
	total: 0
}

var Detail = React.createClass({
	getInitialState() {
		var data = this.props.data; //从index.js通过index.ios.js传进来的
		var ds = new ListView.DataSource({
			rowHasChanged: (r1, r2) => r1 !== r2
		});

		return {
			data: data, //当前视频数据

			// comments
			dataSource: ds.cloneWithRows([]), //评论列表的数据

			// video loads
			videoOk: true, // 默认视频都是好的
			videoLoaded: false, //视频加载状态
			playing: false, //视频播放状态
			paused: false,
			videoProgress: 0.01, // 进度条占宽度的初始比例
			videoTotal: 0, //视频总时间
			currentTime: 0, //当前时间

			// 评论弹窗modal
			content: '',
			animationType: 'none',
			modalVisible: false, //弹框默认不弹出
			isSending: false, //提交的信息是否已经提交出去了

			// 视频控制类
			rate: 1,
			muted: false, //是否静音
			resizeMode: 'contain', //包含 还有cover
			repeat: false
		}
	},

	_pop() { //返回列表页
		this.props.navigator.pop()
	},

	_onLoadStart() {
		console.log('load start');
	},

	_onLoad() {
		console.log('loads');
	},

	_onProgress(data) {
		if (!this.state.videoLoaded) {
			this.setState({
				videoLoaded: true
			})
		}

		var duration = data.playableDuration; // 总共时长
		var currentTime = data.currentTime; // 当前时长
		var percent = Number((currentTime / duration).toFixed(2));
		var newState = {
			videoTotal: duration,
			currentTime: Number(data.currentTime.toFixed(2)),
			videoProgress: percent
		};

		if (!this.state.videoLoaded) { //视频是否加载完
			newState.videoLoaded = true;
		}
		if (!this.state.playing) { // 视频是否在播放
			newState.playing = true;
		}

		this.setState(newState); //修改播放状态
	},

	_onEnd() {
		this.setState({
			videoProgress: 1,
			playing: false
		})
	},

	_onError(e) {
		console.log('出错了');
		this.setState({
			videoOk: false
		})
		console.log(e);
		console.log('error');
	},

	_rePlay() { // 重复播放
		this.refs.videoPlayer.seek(0)
	},

	_pause() { // 暂停
		if (!this.state.paused) {
			this.setState({
				paused: true
			})
		}
	},

	_resume() { // 重新播放
		if (this.state.paused) {
			this.setState({
				paused: false
			})
		}
	},

	componentDidMount() { // 等视频都加载好后请求评论
		this._fetchData()
	},

	_fetchData(page) { //获取第几页的数据
		var that = this;

		this.setState({
			isLoadingTail: true //开始请求
		})

		request.get(config.api.base + config.api.comment, {
				accessToken: 'abcdef',
				creation: 124,
				page: page
			})
			.then((data) => {
				if (data.success) {
					var items = cachedResults.items.slice(); //复制当前数组

					items = items.concat(data.data);
					cachedResults.nextPage += 1;
					cachedResults.items = items;
					cachedResults.total = data.total;

					that.setState({
						isLoadingTail: false, //请求结束
						dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
					})
				}
			})
			.catch((error) => {
				this.setState({
					isLoadingTail: false //请求结束
				})
				console.warn(error);
			})
	},

	_hasMore() {
		return cachedResults.items.length !== cachedResults.total
	},

	_fetchMoreData() {
		if (!this._hasMore() || this.state.isLoadingTail) { //没有更多数据或已在加载中
			return
		}

		var page = cachedResults.nextPage; //要展现的页码

		this._fetchData(page);
	},

	_renderFooter() {
		if (!this._hasMore() && cachedResults.total !== 0) {
			return (
				<View style={styles.loadingMore}>
					<Text style={styles.loadingText}>没有更多了</Text>	
				</View>
			)
		}

		if (this.state.isLoadingTail) { // 已经在请求了返回一个空节点
			return <View style={styles.loadingMore} />
		}

		return <ActivityIndicator style={styles.loadingMore}/> //下拉展现小菊花
	},

	_renderRow(row) {
		return ( // 返回每条视图的模板
			<View key={row._id} style={styles.replyBox}>
				<Image style={styles.replyAvatar} source={{uri: row.replyBy.avatar}} />
	        	<View style={styles.reply}>
	        		<Text style={styles.replyNickname}>{row.replyBy.nickname}</Text>
	        		<Text style={styles.replyTitle}>{row.content}</Text>
	        	</View>
			</View>
		)
	},

	_focus() { // 点击输入框弹出评论框
		this._setModalVisible(true);
	},

	_blur() {

	},

	_closeModal() {
		this._setModalVisible(false)
	},

	_setModalVisible(isVisible) { //是否显示浮层
		this.setState({
			modalVisible: isVisible
		})
	},

	_renderHeader() { // 发布者相关信息展示以及评论区
		var data = this.state.data;

		return (
			<View style={styles.listHeader}>
				<View style={styles.infoBox}>
		        	<Image style={styles.avatar} source={{uri: data.author.avatar}} />
		        	<View style={styles.descBox}>
		        		<Text style={styles.nickname}>{data.author.nickname}</Text>
		        		<Text style={styles.title}>{data.title}</Text>
		        	</View>
		    	</View>
		    	<View style={styles.commentBox}>
					<View style={styles.comment}>
						<TextInput
							placeholder='敢不敢评论一个...'
							style={styles.content}
							multiline={true}
							onFocus={this._focus}
						/>
					</View>		    		
		    	</View>

		    	<View style={styles.commentArea}>
		    		<Text style={styles.commentTitle}>精彩评论</Text>
		    	</View> 
		    </View>
		)
	},

	_submit() { //提交
		var that = this
		if (!this.state.content) {
			return AlertIOS.alert('留言不能为空！')
		}

		if (this.state.isSending) {
			return AlertIOS.alert('正在评论中！')
		}

		this.setState({
			isSending: true
		}, function() {
			var body = {
				accessToken: 'abc',
				creation: '1323', //评论哪个视频
				content: this.state.content //提交的内容
			}

			var url = config.api.base + config.api.comment;

			request.post(url, body)
				.then(function(data) {
					if (data && data.success) {
						// 把新提交的内容与之前的内容作拼接
						var items = cachedResults.items.slice();
						var content = that.state.content;

						items = [{
							content: content,
							replyBy: {
								avatar: 'http://dummyimage.com/640x640/20d79d)',
								nickname: '狗狗狗说'
							}
						}].concat(items)

						cachedResults.items = items;
						cachedResults.total = cachedResults.total + 1;

						that.setState({
							content: '',
							isSending: false,
							dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
						})

						that._setModalVisible(false); //隐藏弹框
					}
				})
				.catch((err) => {
					console.log(err);
					that.setState({
						isSending: false
					})
					that._setModalVisible(false);
					AlertIOS.alert('留言失败，稍后重试！')
				})
		})
	},

	render() {
		var data = this.props.data;
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backBox} onPress={this._pop}>
						<Icon name='ios-arrow-back' style={styles.backIcon} />
						<Text style={styles.backText}>返回</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle} numberOflines={1}>视频详情页</Text>						
				</View>
		        <View style={styles.videoBox}>
		        	<Video
		        		ref='videoPlayer'   //相当于对这个组件的引用
		        		source={{uri: data.video}}
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

		        	{    //当视频出错的时候，要有个容错的处理
		        		!this.state.videoOk && <Text style={styles.failText}>视频出错了！很抱歉</Text>
		        	}	

		        	{
		        		!this.state.videoLoaded && <ActivityIndicator color='#ee735c' style={styles.loading} />  //加载视频前的菊花
		        	}

		        	{             // 视频播放完能重新播放(视频加载好没有播放) 
		        		this.state.videoLoaded && !this.state.playing
		        		? <Icon
		        			onPress={this._rePlay}
		        			name='ios-play'
		        			size={48}
		        			style={styles.playIcon} />
		        		: null
		        	}

		        	{            // 增加暂停播放功能
		        		this.state.videoLoaded && this.state.playing
		        		? <TouchableOpacity onPress={this._pause} style={styles.pauseBtn}>
		        			{
		        				this.state.paused
		        				?<Icon onPress={this._resume} size={48} name='ios-play' style={styles.resumeIcon} />
		        				: <Text></Text>
		        			}
		        		</TouchableOpacity>
		        		: null
		        	}

		        	<View style={styles.progressBox}> 
		        		<View style={[styles.progressBar, {width: width * this.state.videoProgress}]}></View>
		        	</View>
		        </View>
		        	
	        	<ListView 
	        		dataSource={this.state.dataSource}
			        renderRow={this._renderRow}		// 列表页布局
			        renderHeader={this._renderHeader}
			        renderFooter={this._renderFooter} //列表底部再增加一栏
			      	onEndReached={this._fetchMoreData}  // 到底部时加载更多
			      	onEndReachedThreshold={20}   // 还有多少距离执行预加载
			        enableEmptySections={true} 
			        showsVerticalScrollIndicator={false} //隐藏右边滚动条
			        automaticallyAdjustContentInsets={false}			        
	        	/>

	        	<Modal       //评论浮层
	        		animationType={'fade'}  // 浮层出现形式
	        		visible={this.state.modalVisible}   //是否可见   
	        		onRequestClose={() => {this._setModalVisible(false)}}>  
	        		<View style={styles.modalContainer}>
	        			<Icon
	        				onPress={this._closeModal}
	        				name='ios-close-outline'
	        				style={styles.closeIcon} />
	        			<View style={styles.commentBox}>
							<View style={styles.comment}>
								<TextInput
									placeholder='敢不敢评论一个...'
									style={styles.content}
									multiline={true}
									defaultValue={this.state.content}
									onChangeText={(text) => {  //修改文本框中的值
										this.setState({
											content: text
										})	
									}}
								/>
							</View>		    		
				    	</View>	

				    	<Button style={styles.submitBtn} onPress={this._submit}>评论</Button>
	        		</View>
	        	</Modal>	   
		    </View>
		)
	}
})

var styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5FCFF',
	},

	modalContainer: {
		flex: 1, //覆盖全屏所以为1
		paddingTop: 45,
		backgroundColor: '#fff'
	},

	closeIcon: { // 关闭图标
		alignSelf: 'center',
		fontSize: 30,
		color: '#ee753c'
	},

	submitBtn: {
		width: width - 20,
		padding: 16,
		marginTop: 20,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#ee753c',
		borderRadius: 4,
		fontSize: 18,
		color: '#ee753c'
	},

	header: {
		flexDirection: 'row',
		justifyContent: 'center', //居中对齐
		alignItems: 'center',
		width: width,
		height: 64,
		paddingTop: 20,
		paddingLeft: 10,
		paddingRight: 10,
		borderBottomWidth: 1, //底部边框线
		borderColor: 'rgba(0,0,0,0.1)',
		backgroundColor: '#fff'
	},

	backBox: {
		position: 'absolute',
		left: 12,
		top: 32,
		width: 50,
		flexDirection: 'row',
		alignItems: 'center'
	},

	headerTitle: {
		width: width - 120,
		textAlign: 'center'
	},

	backIcon: {
		paddingTop: 2,
		color: '#999',
		fontSize: 20,
		marginRight: 5
	},

	backText: {
		color: '#999'
	},

	videoBox: {
		width: width,
		height: width * 0.56,
		backgroundColor: '#000'
	},

	video: {
		width: width,
		height: width * 0.56,
		backgroundColor: '#000'
	},

	failText: { // 视频出错时的提示
		position: 'absolute',
		left: 0,
		top: 90,
		width: width, //占了这一行
		textAlign: 'center',
		color: '#fff',

		backgroundColor: 'transparent'
	},

	loading: {
		position: 'absolute',
		left: 0,
		top: 80,
		width: width, //占了这一行
		alignSelf: 'center', //自己怎么对齐
		backgroundColor: 'transparent'
	},

	progressBox: { //进度条容器
		width: width,
		height: 2,
		backgroundColor: '#ccc'
	},

	progressBar: { //进度条
		width: 1,
		height: 2,
		backgroundColor: '#ff6600'
	},

	playIcon: {
		position: 'absolute',
		top: 90,
		left: width / 2 - 30,
		width: 60,
		height: 60,
		paddingTop: 8,
		paddingLeft: 22,
		backgroundColor: 'transparent',
		borderColor: '#fff',
		borderWidth: 1,
		borderRadius: 30,
		color: '#ed7b66'
	},

	pauseBtn: {
		position: 'absolute',
		left: 0,
		top: 0,
		width: width,
		height: width * 0.56
	},

	resumeIcon: { //重新播放
		position: 'absolute',
		top: 80,
		left: width / 2 - 30,
		width: 60,
		height: 60,
		paddingTop: 8,
		paddingLeft: 22,
		backgroundColor: 'transparent',
		borderColor: '#fff',
		borderWidth: 1,
		borderRadius: 30,
		color: '#ed7b66'
	},

	//评论页
	infoBox: {
		width: width,
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 10
	},

	avatar: {
		width: 60,
		height: 60,
		marginRight: 10,
		marginLeft: 10,
		borderRadius: 30
	},

	descBox: {
		flex: 1
	},

	nickname: {
		fontSize: 18
	},

	title: {
		marginTop: 8,
		fontSize: 16,
		color: '#666'
	},

	replyBox: {
		flexDirection: 'row',
		justifyContent: 'flex-start', //左对齐
		marginTop: 10
	},

	replyAvatar: { // 回复人头像
		width: 40,
		height: 40,
		marginRight: 10,
		marginLeft: 10,
		borderRadius: 20
	},

	replyNickname: { // 回复人姓名
		color: '#666'
	},

	replyContent: { // 回复内容
		marginTop: 4,
		color: '#666'
	},

	reply: {
		flex: 1
	},

	loadingMore: {
		marginVertical: 20
	},

	loadingText: {
		color: '#777',
		textAlign: 'center'
	},

	listHeader: {
		width: width,
		marginTop: 10
	},

	/* 评论区 */
	commentBox: {
		marginTop: 10,
		marginBottom: 10,
		padding: 8,
		width: width
	},

	content: {
		paddingLeft: 2,
		color: '#333',
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
		fontSize: 14,
		height: 80
	},

	commentArea: {
		width: width,
		paddingBottom: 6,
		paddingLeft: 10,
		paddingRight: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#eee'
	}
});

module.exports = Detail;