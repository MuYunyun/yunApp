/**
 * Sample React Native App
 * https: //github.com/facebook/react-native
 * @flow
 */

/* 轮播图 */
// ES5
var React = require('react');
var Swiper = require('react-native-swiper'); //轮播图组件 
var ReactNative = require('react-native');
var Button = require('react-native-button');

var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var Image = ReactNative.Image;

var Dimensions = ReactNative.Dimensions; //获取可视区宽度的模块
var width = Dimensions.get('window').width;

var Slider = React.createClass({
	getInitialState() {
		return {
			loop: false, //只轮播一次
			banners: [
				require('../assets/images/s1.png'),
				require('../assets/images/s2.png'),
				require('../assets/images/s3.png')
			]
		}
	},

	_enter() {
		this.props.enterSlide()
	},

	render() {
		return (
			<Swiper 
				style={styles.wrapper} paginationStyle={styles.pagination} loop={this.state.loop} >
		        <View style={styles.slide}>
		          <Image style={styles.image} source={this.state.banners[0]} />
		        </View>
		        <View style={styles.slide}>
		          <Image style={styles.image} source={this.state.banners[1]} />
		        </View>
		        <View style={styles.slide}>
		          <Image style={styles.image} source={this.state.banners[2]} />
		          <Text
			        style={styles.btn}
			        onPress={this._enter}>马上体验</Text>
		        </View>
		     </Swiper>
		)
	}
})

var styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	slide: {
		flex: 1,
		width: width
	},

	image: {
		flex: 1,
		width: width
	},

	pagination: {
		bottom: 30
	},

	btn: {
		width: width - 20,
		position: 'absolute',
		left: 10,
		bottom: 60,
		height: 50,
		padding: 10,
		backgroundColor: '#ee735c',
		borderColor: '#ee735c',
		borderWidth: 1,
		textAlign: 'center',
		fontSize: 18,
		borderRadius: 3,
		color: '#fff'
	}
})

module.exports = Slider