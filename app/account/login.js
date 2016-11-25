/**
 * Sample React Native App
 * https: //github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react');
var ReactNative = require('react-native');
var Button = require('react-native-button');
import {
	CountDownText
} from 'react-native-sk-countdown'; //倒计时模块

var request = require('../common/request');
var config = require('../common/config');

var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var TextInput = ReactNative.TextInput;
var AlertIOS = ReactNative.AlertIOS;
var AsyncStorage = ReactNative.AsyncStorage;

var Login = React.createClass({
	getInitialState() {
		return {
			verifyCode: '', //验证码默认为空值
			phoneNumber: '', //默认为空值
			countingDone: false, //默认剩余秒数没结束
			codeSent: false // 默认验证码未发送
		}
	},

	_showVerifyCode() { // 显示验证码
		this.setState({
			codeSent: true
		})
	},

	_countingDone() { //倒计时结束后改变状态      
		this.setState({
			countingDone: true
		})
	},

	_sendVerifyCode() { // 发送验证码
		var that = this;
		var phoneNumber = this.state.phoneNumber;

		if (!phoneNumber) { // phoneNumber为空
			return AlertIOS.alert('手机号不能为空！')
		}

		var body = {
			phoneNumber: phoneNumber
		}

		var signupURL = config.api.base + config.api.signup;

		request.post(signupURL, body)
			.then((data) => {
				if (data && data.success) {
					that._showVerifyCode(); //获取验证码
				} else {
					AlertIOS.alert('获取验证码失败，请验证手机号是否正确');
				}
			})
			.catch((err) => {
				AlertIOS.alert('获取验证码失败，请检查网络是否良好');
			})
	},

	_submit() { // 验证手机号和验证码
		var that = this;
		var phoneNumber = this.state.phoneNumber; //手机号
		var verifyCode = this.state.verifyCode; //验证码

		if (!phoneNumber || !verifyCode) { // phoneNumber为空
			return AlertIOS.alert('手机号或验证码不能为空！')
		}

		var body = {
			phoneNumber: phoneNumber,
			verifyCode: verifyCode,
		}

		var verifyURL = config.api.base + config.api.verify;

		request.post(verifyURL, body)
			.then((data) => {
				if (data && data.success) {
					that.props.afterLogin(data.data); //同步到外层的路口文件里的组件
				} else {
					AlertIOS.alert('获取验证码失败，请验证手机号是否正确');
				}
			})
			.catch((err) => {
				AlertIOS.alert('获取验证码失败，请检查网络是否良好');
			})
	},

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.signupBox}>
					<Text style={styles.title}>快速登录</Text>
					<TextInput
						placeholder='输入手机号'
						autoCaptialize={'none'}  //不去纠正大小写
						autoCorrect={false}    //不去纠正内容的对与错
						keyboardType={'number-pad'}
						style={styles.inputField}
						onChangeText={(text) => {
							this.setState({
								phoneNumber: text
							})
						}}
					/>

					{
						this.state.codeSent    //展示输入验证码的框
						? <View style={styles.verifyCodeBox}>
							<TextInput
								placeholder='输入验证码'
								autoCaptialize={'none'}  //不去纠正大小写
								autoCorrect={false}    //不去纠正内容的对与错
								keyboardType={'number-pad'}
								style={styles.inputyzField}
								onChangeText={(text) => {
									this.setState({
										verifyCode: text
									})
								}}
							/>

								{
									this.state.countingDone    //倒计时结束再次获取验证码
									? <Button
										style={styles.countBtn}
										onPress={this._sendVerifyCode}>获取验证码</Button>
									: <CountDownText
										style={styles.countBtn}
										countType='seconds' // 计时类型：seconds / date
							            auto={true} // 自动开始
							            afterEnd={this._countingDone} // 结束回调
							            timeLeft={60} // 正向计时 时间起点为0秒
							            step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
							            startText='获取验证码' // 开始的文本
							            endText='获取验证码' // 结束的文本
							            intervalText={(sec) => '剩余秒数:' + sec} // 定时的文本回调
							           />		
								}
						</View>
						: null
					}

					{
						this.state.codeSent
						? <Button
							style={styles.btn}
							onPress={this._submit}>登录</Button>
						: <Button
							style={styles.btn}
							onPress={this._sendVerifyCode}>获取验证码</Button>	
					}
				</View>
      		</View>
		)
	}
})

var styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 10,
		backgroundColor: '#f9f9f9'
	},

	signupBox: {
		marginTop: 30
	},

	title: {
		marginBottom: 20,
		color: '#333',
		fontSize: 20,
		textAlign: 'center'
	},

	inputField: {
		height: 40,
		padding: 5,
		color: '#666',
		fontSize: 16,
		backgroundColor: '#fff',
		borderRadius: 4
	},

	inputyzField: { // 验证码输入框
		flex: 1,
		height: 40,
		padding: 5,
		color: '#666',
		fontSize: 16,
		backgroundColor: '#fff',
		borderRadius: 4
	},

	verifyCodeBox: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},

	countBtn: {
		width: 110,
		height: 40,
		padding: 10,
		marginLeft: 8,
		backgroundColor: '#ee735c',
		borderColor: '#ee735c',
		color: '#fff',
		textAlign: 'center',
		fontWeight: '600',
		fontSize: 15,
		borderRadius: 2
	},

	btn: {
		marginTop: 10,
		padding: 10,
		backgroundColor: 'transparent',
		borderColor: '#ee735c',
		textAlign: 'center',
		borderWidth: 1,
		borderRadius: 4,
		color: '#ee735c'
	}
})

module.exports = Login