/**
 * Sample React Native App
 * https: //github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react');
var sha1 = require('sha1');
var ReactNative = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
var Button = require('react-native-button');
var Progress = require('react-native-progress'); // 上传进度组件
var ImagePicker = require('react-native-image-picker'); // 弹出相册或拍照

var request = require('../common/request');
var config = require('../common/config');

var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var TextInput = ReactNative.TextInput;
var View = ReactNative.View;
var Modal = ReactNative.Modal;
var AlertIOS = ReactNative.AlertIOS;
var Image = ReactNative.Image;
var AsyncStorage = ReactNative.AsyncStorage;
var TouchableOpacity = ReactNative.TouchableOpacity;
var Dimensions = ReactNative.Dimensions; //获取可视区宽度的模块
var width = Dimensions.get('window').width;

var photoOptions = { // react-native-image-picker文档里的一些配置
	title: '选择头像',
	cancelButtonTitle: '取消',
	takePhotoButtonTitle: '拍照',
	chooseFromLibraryButtonTitle: '选择相册',
	quality: 0.75,
	allowsEditing: true, //是否允许拉伸检查  
	noData: false, //允许转化为64位
	storageOptions: {
		skipBackup: true,
		path: 'images'
	}
};


function avatar(id, type) { //生成一个cloudinary图床图片地址
	if (id.indexOf('http') > -1) {
		return id
	}

	if (id.indexOf('data:image') > -1) { //base64
		return id
	}

	if (id.indexOf('avatar/') > -1) { // cloudinary图床
		return config.cloudinary.base + '/' + type + '/upload/' + id
	}

	return 'http://oh87gl620.bkt.clouddn.com/' + id //七牛云测试地址
}

var Account = React.createClass({
	getInitialState() {
		var user = this.props.user || {};

		return {
			user: user,
			avatarProgress: 0, //上传图片进度值
			avatarUploading: false, //没有上传的
			modalVisible: false // 编辑的浮层默认不显示
		}
	},

	_edit() {
		this.setState({
			modalVisible: true
		})
	},

	_closeModal() {
		this.setState({
			modalVisible: false
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

				// user.avatar = ''
				// AsyncStorage.setItem('user', JSON.stringify(user));

				if (user && user.accessToken) {
					that.setState({
						user: user
					})
				}
			})
	},

	_getQiniuToken() {
		var accessToken = this.state.user.accessToken;
		var signatureURL = config.api.base + config.api.signature;

		return request.post(signatureURL, {
				accessToken: accessToken,
				type: 'avatar', //上传种类是图像
				cloud: 'qiniu' //证明是请求七牛
			})
			.catch((err) => {
				console.log(err);
			})
	},

	_pickPhoto() { //打开相机
		var that = this;

		ImagePicker.showImagePicker(photoOptions, (res) => {
			if (res.didCancel) { // 用户取消选图的操作
				return
			}

			var avartarData = 'data:image/jpeg;base64,' + res.data;
			var uri = res.uri;
			//console.log('uri是' + uri);

			that._getQiniuToken()
				.then((data) => {
					if (data && data.success) {
						var token = data.data.token;
						var key = data.data.key;
						var body = new FormData(); //发起表单请求

						body.append('token', token); //签名值
						body.append('key', key);
						body.append('file', {
							type: 'image/jpeg',
							uri: uri,
							name: key
						});

						that._upload(body); //异步提交
					}
				})


			// request.post(signatureURL, {
			// 		accessToken: accessToken,
			// 		key: key,
			// 		timestamp: timestamp,
			// 		type: 'avatar'
			// 	})
			// 	.catch((err) => {
			// 		console.log(err);
			// 	})
			// 	.then((data) => {
			// 		if (data && data.success) {

			// 			var signature = data.data;

			// 			var body = new FormData(); //发起表单请求

			// 			body.append('folder', folder);
			// 			body.append('signature', signature); //签名值
			// 			body.append('tags', tags);
			// 			body.append('timestamp', timestamp);
			// 			body.append('api_key', config.cloudinary.api_key);
			// 			body.append('resource_type', 'image');
			// 			body.append('file', avartarData);

			// 			that._upload(body); //异步提交
			// 		}
			// 	})
		})
	},

	_upload(body) { // 异步请求
		var that = this;
		var xhr = new XMLHttpRequest();
		var url = config.qiniu.upload;

		//console.log(body);

		this.setState({
			avatarUploading: true, //设置为上传状态
			avatarProgress: 0 //上传多次的话每次重置为0
		})

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
				var user = this.state.user;

				if (response.public_id) { //public_id是cloudinary图床返回图片ID
					user.avatar = response.public_id;
				}

				if (response.key) { //七牛云返回图片
					user.avatar = response.key;
				}

				that.setState({
					avatarUploading: false, //设置上传状态结束
					avatarProgress: 0,
					user: user
				})

				that._asyncUser(true); // 同步用户的信息
			}
		}

		if (xhr.upload) { //这里都是原生方法
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					var percent = Number((event.loaded / event.total).toFixed(2))

					that.setState({
						avatarProgress: percent
					})
				}
			}
		}

		xhr.send(body);
	},

	_asyncUser(isAvatar) { // 服务器更新用户信息,并返回
		var that = this;
		var user = this.state.user;

		if (user && user.accessToken) {
			var url = config.api.base + config.api.update;
			request.post(url, user)
				.then((data) => {
					if (data && data.success) {
						var user = data.data;

						if (isAvatar) {
							AlertIOS.alert('头像更新成功');
						}

						that.setState({
							user: user
						}, function() {
							that._closeModal();
							AsyncStorage.setItem('user', JSON.stringify(user))
						})
					}
				})
		}
	},

	_changeUserState(key, value) { // 编辑状态
		var user = this.state.user;

		user[key] = value;
		this.setState({
			user: user
		})
	},

	_submit() { //保存
		this._asyncUser();
	},

	_logout() { // 退出登录(把本地资料清空，同时改变APP的登录状态)
		this.props.logout(); //通过这种方式，调用上层组件的登出方法
	},

	render() {
		var user = this.state.user;

		return (
			<View style={styles.container}>
				<View style={styles.toolbar}>
					<Text style={styles.toolbarTitle}>我的账户</Text>
					<Text style={styles.toolbarExtra} onPress={this._edit}>编辑</Text>
				</View>

				{
					user.avatar   //是否有图片决定显示哪一块
					? <TouchableOpacity onPress={this._pickPhoto} style={styles.avatarContainer}>
						<Image source={{uri: avatar(user.avatar, 'image')}} style={styles.avatarContainer}>
							<View style={styles.avatarBox}>
								{
									this.state.avatarUploading //根据判断是否上传中
									? <Progress.Circle    // // 这个地方有坑
										showsText={true} //是否显示文本
										size={75} 
										color={'#ee735c'}
										progress = {
											this.state.avatarProgress
										}
										/> // 上传比例系数
									: <Image
										source={{uri: avatar(user.avatar, 'image')}}
										style={styles.avatar} />
								}				
							</View>
							<Text style={styles.avatarTip}>戳这里换头像</Text>
						</Image>
					</TouchableOpacity>
					: <TouchableOpacity onPress={this._pickPhoto} style={styles.avatarContainer}>
						<Text style={styles.avatarTip}>添加头像</Text>
						<View style={styles.avatarBox}>
							{
								this.state.avatarUploading //根据判断是否上传中
								 ? <Progress.Circle 
									showsText={true} //是否显示文本
									size={75} 
									color={'#ee735c'}
									progress={this.state.avatarProgress} /> //上传比例系数
								: <Icon
									name='ios-cloud-upload-outline'
									style={styles.plusIcon} />
							}
						</View>
					</TouchableOpacity>
				}

				<Modal
					animationType={"slide"}
					visible={this.state.modalVisible}>
					<View style={styles.modalContainer}>
						<Icon
							name='ios-close-outline'
							onPress={this._closeModal}
							style={styles.closeIcon} />
						<View style={styles.fieldItem}>
							<Text style={styles.label}>昵称</Text>
							<TextInput
								placeholder={'输入你的昵称'}
								style={styles.inputField}
								autoCapitalize={'none'}
								autoCorrect={false}
								defaultValue={user.nickname}
								onChangeText={(text) => {  //文本发生改变时,text动态地传递
									this._changeUserState('nickname', text)
								}}
							/>	
						</View>	



						<View style={styles.fieldItem}>
							<Text style={styles.label}>品种</Text>
							<TextInput
								placeholder={'种类'}
								style={styles.inputField}
								autoCapitalize={'none'}
								autoCorrect={false}
								defaultValue={user.breed}
								onChangeText={(text) => {
									this._changeUserState('breed', text)
								}}
							/>	
						</View>

						<View style={styles.fieldItem}>
							<Text style={styles.label}>年龄</Text>
							<TextInput
								placeholder={'年龄'}
								style={styles.inputField}
								autoCapitalize={'none'}
								autoCorrect={false}
								defaultValue={user.age}
								onChangeText={(text) => {
									this._changeUserState('age', text)
								}}
							/>	
						</View>


						<View style={styles.fieldItem}>
							<Text style={styles.label}>性别</Text>
							<Icon.Button
								onPress={() => {
									this._changeUserState('gender', 'male')
								}}
								style={[
									styles.gender,
									user.gender === 'male' && styles.genderChecked
								]}
								name='ios-paw'>男</Icon.Button>
							<Icon.Button
								onPress={() => {
									this._changeUserState('gender', 'female')
								}}
								style={[
									styles.gender,
									user.gender === 'female' && styles.genderChecked
								]}
								name='ios-paw-outline'>女</Icon.Button>	
						</View>

						<Button
							style={styles.btn}
							onPress={this._submit}>保存资料</Button>
					</View>
				</Modal>
				
				<Button
					style = {
						styles.btn
					}
					onPress={this._logout}>退出登录</Button>
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

	avatarContainer: {
		width: width,
		height: 140,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#666'
	},

	avatarTip: {
		color: '#fff',
		backgroundColor: 'transparent',
		fontSize: 14
	},

	avatarBox: {
		marginTop: 15,
		alignItems: 'center',
		justifyContent: 'center'
	},

	avatar: { //头像
		marginBottom: 15,
		width: width * 0.2,
		height: width * 0.2,
		resizeMode: 'cover', //铺满
		borderRadius: width * 0.1
	},

	plusIcon: {
		padding: 20,
		paddingLeft: 25,
		paddingRight: 25,
		color: '#999',
		fontSize: 24,
		backgroundColor: '#fff',
		borderRadius: 8
	},

	modalContainer: { //浮层样式
		flex: 1,
		paddingTop: 50,
		backgroundColor: '#fff'
	},

	fieldItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 50,
		paddingLeft: 15,
		paddingRight: 15,
		borderColor: '#eee',
		borderBottomWidth: 1
	},

	label: { // 昵称
		color: '#ccc',
		marginRight: 10
	},

	closeIcon: { // 关闭按钮
		position: 'absolute',
		width: 40,
		height: 40,
		fontSize: 32,
		right: 20,
		top: 30,
		color: '#ee735c'
	},

	gender: { // 性别样式
		backgroundColor: '#ccc'
	},

	genderChecked: { //性别选中样式
		backgroundColor: '#ee735c'
	},

	inputField: {
		flex: 1,
		height: 50,
		color: '#666',
		fontSize: 14
	},

	btn: {
		marginTop: 25,
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

module.exports = Account;