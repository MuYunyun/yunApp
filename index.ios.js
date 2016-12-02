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
var Slider = require('./app/account/slider'); //轮播界面

var AppRegistry = ReactNative.AppRegistry;
var StyleSheet = ReactNative.StyleSheet;
var Text = ReactNative.Text;
var View = ReactNative.View;
var TabBarIOS = ReactNative.TabBarIOS;
var Navigator = ReactNative.Navigator; // 导航器
var AsyncStorage = ReactNative.AsyncStorage; // 导航器
var ActivityIndicator = ReactNative.ActivityIndicator; // App刚启动时加载

var Dimensions = ReactNative.Dimensions; //获取可视区宽度的模块
var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;

var yunApp = React.createClass({
  getInitialState() {
    console.log('child', 'getInitialState');
    return {
      user: null, //默认无用户
      selectedTab: 'list',
      entered: false, //这个应用是不是第一次进入，决定出轮播图还是注册页
      booted: false, //有没有启动
      logined: false //默认没有登录过
    }
  },

  //路口文件安装之后没有展现里面子页面的时候需要读取里面存储的数据
  componentDidMount() {
    //AsyncStorage.removeItem('entered');
    this._asyncAppStatus()
  },

  _logout() { // 登出
    AsyncStorage.removeItem('user')

    this.setState({
      logined: false,
      user: null
    })
  },

  _asyncAppStatus() { //查询用户是否登录了
    var that = this;

    AsyncStorage.multiGet(['user', 'entered'])
      .then((data) => { //data的格式如[['user','{}'], ['entered' 'yes']]
        var userData = data[0][1];
        var entered = data[1][1];
        var user
        var newState = {
          booted: true //当获取用户资料时，App已经是ready了。跳过了启动时界面先进入登入界面的尴尬
        }

        if (userData) {
          user = JSON.parse(userData); // 解析为对象
        }

        if (user && user.accessToken) {
          newState.user = user
          newState.logined = true // 登录过
        } else {
          newState.logined = false
        }

        if (entered === 'yes') {
          newState.entered = true
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

  _enterSlide() { //轮播图点马上体验
    this.setState({
      entered: true //改为True,下次登录就跳过轮播图
    }, function() {
      AsyncStorage.setItem('entered', 'yes');
    })
  },

  // Tarbar组件
  render() {
    if (!this.state.booted) { //是否启动，来一个加载小菊花。跳过了启动时界面先进入登入界面的尴尬
      return (
        <View style={styles.bootPage}>
          <ActivityIndicator color="#ee735c" /> 
        </View>
      )
    }

    if (!this.state.entered) { //如果是第一次进入该App的话
      return <Slider enterSlide={this._enterSlide} />
    }

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
  bootPage: {
    width: width,
    height: height,
    backgroundColor: '#fff',
    justifyContent: 'center'
  }
});

AppRegistry.registerComponent('yunApp', () => yunApp);