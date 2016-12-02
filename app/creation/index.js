/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react');
var ReactNative = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');

var request = require('../common/request');
var config = require('../common/config');
var util = require('../common/util');
var Detail = require('./detail');

var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var TouchableHighlight = ReactNative.TouchableHighlight;
var ListView = ReactNative.ListView;
var Image = ReactNative.Image;
var Dimensions = ReactNative.Dimensions; //获取可视区宽度的模块
var ActivityIndicator = ReactNative.ActivityIndicator; //加载的动画
var RefreshControl = ReactNative.RefreshControl; //下拉加载的动画
var AlertIOS = ReactNative.AlertIOS; //加载的动画
var AsyncStorage = ReactNative.AsyncStorage;

var width = Dimensions.get('window').width;

var cachedResults = { //缓存列表中的数据,这样就不会重复加载
	nextPage: 1, //下一页(默认为1)
	items: [], //缓存的数据列表
	total: 0
}

var Item = React.createClass({
	getInitialState() {
		var row = this.props.row;

		return {
			up: row.voted, //点赞
			row: row
		}
	},

	_up() {
		var that = this;
		var up = !this.state.up; // 点击以后的状态
		var row = this.state.row; //数据
		var url = config.api.base + config.api.up;

		var body = { //发到接口上的请求
			id: row._id,
			up: up ? 'yes' : 'no',
			accessToken: this.props.user.accessToken
		}

		request.post(url, body)
			.then(function(data) {
				console.log(data);
				if (data && data.success) {
					that.setState({
						up: up
					})
				} else {
					AlertIOS.alert('点赞失败，稍后重试');
				}
			})
			.catch(function(err) {
				console.log(err);
				AlertIOS.alert('点赞失败，稍后重试');
			})
	},

	render() {
		var row = this.state.row;

		return (
			<TouchableHighlight onPress={this.props.onSelect}>
				<View style={styles.item}>
					<Text style={styles.title}>{row.title}</Text>
					<Image 
						source={{uri: util.thumb(row.qiniu_thumb)}}
						style={styles.thumb}
					>
						<Icon
							name='ios-play'
							size={28}
							style={styles.play} />	
					</Image>
					<View style={styles.itemFooter}>
						<View style={styles.handleBox}>
							<Icon
								name={this.state.up ?'ios-heart' : 'ios-heart-outline'}
								size={28}
								onPress={this._up}
								style={this.state.up ? styles.up : styles.down} />
							<Text style={styles.handleText} onPress={this._up}>喜欢</Text>	
						</View>
						<View style={styles.handleBox}>
							<Icon
								name='ios-chatboxes-outline'
								size={28}
								style={styles.commentIcon} />
							<Text style={styles.handleText}>评论</Text>	
						</View>
					</View>					
				</View>
			</TouchableHighlight>
		)
	}
})

var List = React.createClass({
	getInitialState() {
		var ds = new ListView.DataSource({
			rowHasChanged: (r1, r2) => r1 !== r2
		});
		return {
			isRefreshing: false,
			isLoadingTail: false, //是否加载
			dataSource: ds.cloneWithRows([]),
		};
	},

	_renderRow(row) {
		return <Item 
			key={row._id}
			user={this.state.user} 
			onSelect={() => this._loadPage(row)} 
			row={row} /> //把子组件抽离出来
	},

	componentDidMount() {
		var that = this;

		AsyncStorage.getItem('user') //获取本地存着的user
			.then((data) => {
				var user

				if (data) {
					user = JSON.parse(data)
				}

				if (user && user.accessToken) {
					that.setState({
						user: user
					}, function() {
						that._fetchData(1); //默认获取第一页的数据
					})
				}
			})
	},

	_fetchData(page) { //获取第几页的数据
		var that = this;

		if (page !== 0) {
			this.setState({
				isLoadingTail: true //开始请求
			})
		} else {
			this.setState({
				isRefreshing: true //向上拉
			})
		}

		var user = this.state.user;
		request.get(config.api.base + config.api.creations, {
				accessToken: user.accessToken,
				page: page
			})
			.then((data) => {
				console.log(data);
				if (data && data.success) {
					if (data.data.length > 0) {

						data.data.map(function(item) {
							var votes = item.votes || [];

							if (votes.indexOf(user._id) > -1) { //说明该视频是当前登录用户点过赞的
								item.voted = true;
							} else {
								item.voted = false;
							}

							return item
						})

						var items = cachedResults.items.slice(); //复制当前数组

						if (page !== 0) {
							items = items.concat(data.data);
							cachedResults.nextPage += 1;
						} else {
							items = data.data.concat(items);
						}

						console.log(items);

						cachedResults.items = items;
						cachedResults.total = data.total;

						if (page !== 0) {
							that.setState({
								isLoadingTail: false, //请求结束
								dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
							})
						} else {
							that.setState({
								isRefreshing: false, //请求结束
								dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
							})
						}
					}
				}
			})
			.catch((error) => {
				if (page !== 0) {
					this.setState({
						isLoadingTail: false //请求结束
					})
				} else {
					this.setState({
						isRefreshing: false //请求结束
					})
				}
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

	_onRefresh() { //下拉时候的刷新
		if (!this._hasMore() || this.state.isRefreshing) {
			return
		}

		this._fetchData(0); // 假设后台收到0就是表示是新的列表
	},

	_renderFooter() { //底部再增加一栏
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

		return <ActivityIndicator style={styles.loadingMore}/> //展现小菊花
	},

	_loadPage(row) { //导航器
		this.props.navigator.push({
			name: 'detail',
			component: Detail, //导航到详情页
			params: {
				data: row
			}
		})
	},

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.header}>					
        			<Text style={styles.headerTitle}>列表页面</Text>
				</View>
				<ListView
			      dataSource={this.state.dataSource}
			      renderRow={this._renderRow}		// 列表页布局
			      renderFooter={this._renderFooter} //列表底部再增加一栏
			      onEndReached={this._fetchMoreData}  // 到底部时加载更多
			      refreshControl={            // 上拉
			          <RefreshControl
			            refreshing={this.state.isRefreshing}  //正在刷新
			            onRefresh={this._onRefresh}  //正在触发
			            tintColor="#ff6600"
			            title='拼命加载中...'
			          />
			        }
			      onEndReachedThreshold={20}   // 还有多少距离执行预加载
			      enableEmptySections={true} 
			      showsVerticalScrollIndicator={false} //隐藏右边滚动条
			      automaticallyAdjustContentInsets={false}
			    />
      		</View>
		)
	}
})

/* 列表页样式 */
var styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5FCFF',
	},

	header: {
		paddingTop: 25,
		paddingBottom: 12,
		backgroundColor: '#ee735c'
	},

	headerTitle: {
		color: '#fff',
		fontSize: 16,
		textAlign: 'center',
		fontWeight: '600'
	},

	item: {
		width: width,
		marginBottom: 10,
		backgroundColor: '#fff'
	},

	thumb: {
		width: width,
		height: width * 0.56,
		resizeMode: 'cover'
	},

	title: {
		padding: 10,
		fontSize: 18,
		color: '#333'
	},

	itemFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: '#eee'
	},

	handleBox: {
		padding: 10,
		flexDirection: 'row',
		width: width / 2 - 0.5,
		justifyContent: 'center',
		backgroundColor: '#fff'
	},

	play: {
		position: 'absolute',
		bottom: 14,
		right: 14,
		width: 46,
		height: 46,
		paddingTop: 9,
		paddingLeft: 18,
		backgroundColor: 'transparent',
		borderColor: '#fff',
		borderWidth: 1,
		borderRadius: 23,
		color: '#ed7b66'
	},

	handleText: {
		paddingLeft: 12,
		fontSize: 18,
		color: '#333'
	},

	down: {
		fontSize: 22,
		color: '#333'
	},

	up: {
		fontSize: 22,
		color: '#ed7b66'
	},

	commentIcon: {
		fontSize: 22,
		color: '#333'
	},

	loadingMore: {
		marginVertical: 20
	},

	loadingText: {
		color: '#777',
		textAlign: 'center'
	}
});

module.exports = List;