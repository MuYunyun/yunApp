/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react');
var ReactNative = require('react-native');
var Icon = require('react-native-vector-icons/Ionicons');

var List = require('./app/creation/index'); //列表组件
var Edit = require('./app/edit/index'); //修改组件
var Account = require('./app/account/index'); //账户组件
var Login = require('./app/account/login'); //登录界面

var AppRegistry = ReactNative.AppRegistry;
var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var TabBarIOS = ReactNative.TabBarIOS;
var Navigator = ReactNative.Navigator; // 导航器
var AsyncStorage = ReactNative.AsyncStorage; // 导航器

var yunApp = React.createClass({
  getInitialState() {
    console.log('child', 'getInitialState');
    return {
      user: null, //默认无用户
      selectedTab: 'account',
      logined: false //默认没有登录过
    }
  },

  //路口文件安装之后没有展现里面子页面的时候需要读取里面存储的数据
  componentDidMount() {
    this._asyncAppStatus()
  },

  _logout() { // 登出
    AsyncStorage.removeItem('user')

    this.setState({
      logined: false,
      user: null
    })
  },

  _asyncAppStatus() {
    var that = this;

    AsyncStorage.getItem('user')
      .then((data) => {
        var user
        var newState = {}

        if (data) {
          user = JSON.parse(data); // 解析为对象
        }

        if (user && user.accessToken) {
          newState.user = user
          newState.logined = true // 登录过
        } else {
          newState.logined = false
        }

        that.setState(newState);
      })
  },

  _afterLogin(user) {
    var that = this
    user = JSON.stringify(user) //转化为字符串

    AsyncStorage.setItem('user', user) //存储数据到本地
      .then(() => {
        that.setState({
          logined: true,
          user: user
        })
      })
  },

  // Tarbar组件
  render() {
    if (!this.state.logined) { //如果没登录，返回登录页;如果登录了，返回列表页
      return <Login afterLogin={this._afterLogin} /> //登录注册页传递过来
    }

    return (
      <TabBarIOS tintColor="#ee735c">
        <Icon.TabBarItem
          iconName='ios-videocam-outline'
          selectedIconName='ios-videocam'
          selected={this.state.selectedTab === 'list'}
          onPress={() => {
            this.setState({
              selectedTab: 'list',
            });
          }}>
          <Navigator 
            initialRoute={{
              name: 'list',
              component: List
            }}
            configureScene={(route) => {
              return Navigator.SceneConfigs.FloatFromRight     //从又往左滑动
            }}
            renderScene={(route, navigator) => {
              var Component = route.component;

              return <Component {...route.params} navigator={navigator} />
            }}
          />
        </Icon.TabBarItem>
        <Icon.TabBarItem
          iconName='ios-recording-outline'
          selectedIconName='ios-recording'
          selected={this.state.selectedTab === 'edit'}
          onPress={() => {
            this.setState({
              selectedTab: 'edit',
            });
          }}>
          <Edit />
        </Icon.TabBarItem>
        <Icon.TabBarItem
          iconName='ios-more-outline'
          selectedIconName='ios-more'
          selected={this.state.selectedTab === 'account'}
          onPress={() => {
            this.setState({
              selectedTab: 'account',
            });
          }}>
          <Account user={this.state.user} logout={this._logout} /> 
        </Icon.TabBarItem>
      </TabBarIOS>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('yunApp', () => yunApp);