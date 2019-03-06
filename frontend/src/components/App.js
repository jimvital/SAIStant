import React, { Component } from 'react';
import autobind from 'react-autobind'
import axios from 'axios';
import FacebookProvider, { Login } from 'react-facebook-sdk';
import moment from 'moment';

var _ = require('lodash');

class App extends Component {

  constructor() {
    super();
    autobind(this);
    this.state = {
      group_posts: [],
      categorized_posts: [],
      post_count: 0
    }
  }

  classifyPosts = async (group_post) => {
    let response = await axios.post('http://127.0.0.1:5000/predict', {
      body: {
        id: group_post.id,
        message: group_post.text,
        date_created: group_post.date_created,
        url: group_post.url
      }
    })
    var result = response.data
    this.setState({
      categorized_posts: [...this.state.categorized_posts, {
        label_id: result.label_id,
        topic: result.topic,
        confidence: result.confidence,
        id: result.id,
        url: result.url,
        date_created: result.date_created,
        message: result.message
      }]
    });
    this.forceUpdate();
  }
  savePosts = async (group_posts) => {

    await group_posts.forEach(group_post => {

      if (group_post.message != null) {
        setTimeout(() => {
          this.setState({
            post_count: this.state.post_count + 1,
          });

          this.classifyPosts({
            id: group_post.id,
            text: group_post.message,
            date_created: group_post.created_time,
            url: group_post.permalink_url
          })
        }, 3000);
      }
    })
  }

  getRemainingPosts = async (group_id, token, next) => {

    await fetch(`https://graph.facebook.com/v3.2/${group_id}/feed?fields=permalink_url,message,created_time&limit=1&since=1536192000&next=${next}&access_token=${token}`)
      .then(response => response.json())
      .then(result => {
        if (!result.error && result["data"].length > 0) {
          this.savePosts(result["data"])


          this.getRemainingPosts(group_id, token, result["paging"]["next"])
        }
      }).catch((e) => { console.log(e); });

    return
  }

  handleResponse = async (response) => {
    //SAIS Group ID
    var group_id = "1762491267331648";
    var posts = [];

    console.log(response);

    await fetch(`https://graph.facebook.com/v3.2/${group_id}/feed?fields=permalink_url,message,created_time&limit=1&since=1536192000&access_token=${response.tokenDetail.accessToken}`)
      .then(response => response.json())
      .then(result => {
        if (!result.error && result["data"].length > 0) {
          this.savePosts(result["data"])

          this.getRemainingPosts(group_id, response["tokenDetail"]["accessToken"], result["paging"]["next"])

        }
      }).catch((e) => { console.log(e); });
  }

  handleError = (error) => {
    this.setState({ error });
  }

  render() {
    const { group_posts, post_count, categorized_posts } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">SAIStant</h1>
        </header>

        <FacebookProvider appId="257697858203554">
          <Login
            scope="public_profile, email"
            onResponse={this.handleResponse}
            onError={this.handleError}
          >
            <button>Login via Facebook</button>
          </Login>
        </FacebookProvider>
        <br />
        <h3>Post (w/ message) Count: {post_count}</h3>
        <ol>
          {
            _.orderBy(categorized_posts, ['date_created'], ['asc']).map((post, index) => {
              return (
                <li key={index}>
                  <div>
                    <a href={post.url}>{post.message}</a>
                    <br />
                    Date Posted: {moment(post.date_created).format('YYYY-MM-DD hh:mm:ss')}
                    <br />
                    Label ID: {post.label_id}
                    <br />
                    Category: {post.topic}
                    <br />
                    Confidence: {post.confidence}
                  </div>
                </li>
              )
            })
          }
        </ol>
      </div>
    );
  }
}

export default App;

