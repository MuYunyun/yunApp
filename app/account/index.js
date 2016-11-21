/**
 * Sample React Native App
 * https: //github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react');
var ReactNative = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');
var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var AsyncStorage = ReactNative.AsyncStorage;

var Account = React.createClass({
	getInitialState() {
		return {
			user: {
				nickname: '老四',
				times: 0
			}
		}
	},

	componentDidMount() {
		var that = this;

		// AsyncStorage.multiSet([
		// 		['user1', '1'],
		// 		['user2', '2']
		// 	])
		// 	.then(function() {
		// 		console.log('save ok');
		// 	})

		// AsyncStorage.multiGet(['user1', 'user2', 'user'])
		// 	.then(function(data) {
		// 		console.log(data);

		// 		console.log(JSON.parse(data[2][1]));
		// 	})

		AsyncStorage.multiRemove(['user1', 'user2'])
			.then(function() {
				console.log('remove ok')
				AsyncStorage.multiGet(['user1', 'user2', 'user'])
					.then(function(data) {
						console.log(data);
						console.log(JSON.parse(data[2][1]));
					})
			})

		// AsyncStorage
		// 	.getItem('user') //user存在
		// 	.catch(function(err) {
		// 		console.log(err);
		// 		console.log('get fails'); //user不存在
		// 	})
		// 	.then(function(data) {
		// 		console.log(1);
		// 		console.log(data);

		// 		if (data) {
		// 			data = JSON.parse(data)
		// 		} else {
		// 			data = that.state.user;
		// 		}

		// 		that.setState({
		// 			user: data
		// 		}, function() {
		// 			data.times++;

		// 			var userData = JSON.stringify(data);

		// 			AsyncStorage
		// 				.setItem('user', userData)
		// 				.catch(function(err) {
		// 					console.log(err);
		// 					console.log('save fails');
		// 				})
		// 				.then(function() {
		// 					console.log('save ok');
		// 				})
		// 		})
		// 	})

		// AsyncStorage.removeItem('user')   //清除
		// 	.then(function() {
		// 		console.log('remove ok');
		// 	})
	},

	render() {
		return (
			<View style={styles.container}>
				<Text style={[styles.item, styles.item1]}>老大，你😊么</Text>
				<View style={[styles.item, styles.item2]}>
					<Text>老二喜极而泣</Text>
				</View>
				<View style={[styles.item, styles.item1]}>
					<Text>老三，老大欺负你么？</Text>
				</View>
				<Text style={[styles.item, styles.item3]}>
					{this.state.user.nickname}不爽了{this.state.user.times}次
				</Text>
      		</View>
		)
	}
})

var styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 30,
		paddingBottom: 70,
		flexWrap: 'nowrap', //挤不下就挤出去
		flexDirection: 'row', //排列方向
		justifyContent: 'space-between', //竖直:两端对齐
		alignItems: 'center', // 水平
		backgroundColor: '#ff6600',
	},
	item1: {
		flex: 1,
		backgroundColor: '#ccc',
	},
	item2: {
		width: 100,
		backgroundColor: '#999',
	},
	item3: {
		flex: 2,
		backgroundColor: '#666',
	}
});

module.exports = Account;