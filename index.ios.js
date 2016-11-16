/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// ES5
// var ReactNative = require('react-native');
// var React = require('react');
// var Component = React.Component;
// var AppRegistry = ReactNative.AppRegistry;
// var StyleSheet = ReactNative.StyleSheet;
// var Text = ReactNative.Text;
// var View = ReactNative.View;

//ES6
import React, {
  Component
} from 'react'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native'

var Son = React.createClass({
  getDefaultProps: function() {
    console.log('child', 'getDefaultProps');
  },

  getInitialState: function() {
    console.log('child', 'getInitialState');
    return {
      times: this.props.times
    }
  },

  timesPlus: function() {
    let times = this.state.times;

    times++;
    this.setState({
      times: times
    })
  },

  componentWillMount: function() {
    console.log('child', 'componentWillMount');
  },

  componentDidMount: function() {
    console.log('child', 'componentDidMount');
  },

  componentWillReceiveProps: function(props) {
    console.log(this.props);
    console.log('child', 'componentWillReceiveProps');
    this.setState({
      times: props.times
    })
  },

  shouldComponentUpdate: function() {
    console.log('child', 'shoudComponentUpdate');
    return true
  },

  componentWillUpdate: function() {
    console.log('child', 'componentWillUpdate');
  },

  componentDidUpdate: function() {
    console.log('child', 'componentDidUpdate');
  },

  timesReset: function() {
    this.props.timesReset()
  },

  render: function() {
    console.log('child', 'render');
    return (
      <View style={sonStyles.container}>
        <Text style={sonStyles.welcome} onPress={this.timesPlus}>
          儿子：有本事揍我啊！
        </Text>
        <Text style={sonStyles.instructions}>
          你居然揍我 {this.state.times} 次
        </Text>
        <Text style={sonStyles.instructions} onPress={this.timesReset}>
          信不信我亲亲你
        </Text>
      </View>
    );
  }
});

// 通过class extends引用，不加逗号
class yunApp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hit: false,
      times: 2
    }
  }

  componentWillMount() {
    console.log('father', 'componentWillMount');
  }

  componentDidMount() {
    console.log('father', 'componentDidMount');
  }

  shouldComponentUpdate() {
    console.log('father', 'shoudComponentUpdate');
    return true
  }

  componentWillUpdate() {
    console.log('father', 'componentWillUpdate');
  }

  componentDidUpdate() {
    console.log('father', 'componentDidUpdate');
  }

  timesReset() {
    this.setState({
      times: 0
    })
  }

  willHit() {
    this.setState({
      hit: !this.state.hit
    })
  }

  timesPlus() {
    var times = this.state.times;

    times += 3;
    this.setState({
      times: times
    })
  }

  render() {
    console.log('father', 'render');
    return (
      <View style={styles.container}>
      {
        this.state.hit
        ? <Son times={this.state.times} timesReset={this.timesReset.bind(this)} />
        : null
      }
      <Text style={styles.welcome} onPress={this.timesReset.bind(this)}>
        老子说：心情好放你一马
      </Text>
      <Text style={styles.instructions} onPress={this.willHit.bind(this)}>
        到底揍不揍
      </Text> 
      <Text style={styles.instructions}>
        就揍了你 {this.state.times} 次而已
      </Text> 
      <Text style={styles.instructions} onPress={this.timesPlus.bind(this)}>
        不听话，再揍你3次
      </Text> 
    </View>
    );
  }
}

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

var sonStyles = StyleSheet.create({
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