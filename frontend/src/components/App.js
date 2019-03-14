import React, { Component } from 'react';
import autobind from 'react-autobind'
import axios from 'axios';
import FacebookProvider, { Login } from 'react-facebook-sdk';
import moment from 'moment';

import flow from 'lodash/fp/flow';
import groupBy from 'lodash/fp/groupBy';
import orderBy from 'lodash/fp/orderBy';

var _ = require('lodash');

const initialState = {
  group_posts: [],
  categorized_posts: [],
  post_count: 0,
  filter_attribute: 'category',
  temp_search: '',
  search_value: '',
  sort_value: 'asc',
  organize_by_value: 'full_date_time',
  date_value: '',
  month_value: '',
  year_value: '',
  category_filter_value: '-1',
  showMonthDropdown: false,
  showDayDropdown: false
}

class App extends Component {

  constructor() {
    super();
    autobind(this);
    this.state = initialState
    this.filter_dropdown = React.createRef();
    this.organize_dropdown = React.createRef();
    this.sort_dropdown = React.createRef();
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
        full_date_time: moment(result.date_created).format('YYYY-MM-DD hh:mm:ss'),
        date: moment(result.date_created).format('DD'),
        month: moment(result.date_created).format('MM'),
        year: moment(result.date_created).format('YYYY'),
        time: moment(result.date_created).format('hh:mm:ss'),
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
        // console.log(this.state.categorized_posts)
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
    // var posts = [];

    console.log(response);
    //&limit=1
    await fetch(`https://graph.facebook.com/v3.2/${group_id}/feed?fields=permalink_url,message,created_time&since=1536192000&access_token=${response.tokenDetail.accessToken}`)
      .then(response => response.json())
      .then(result => {
        if (!result.error && result["data"].length > 0) {
          this.savePosts(result["data"])

          // this.getRemainingPosts(group_id, response["tokenDetail"]["accessToken"], result["paging"]["next"])

        }
      }).catch((e) => { console.log(e); });
  }

  handleError = (error) => {
    this.setState({ error });
  }

  handleSearchChange(e) {
    this.setState({temp_search: e.target.value});
  }

  handleSearchSubmit() {
    this.setState({search_value: this.state.temp_search});
  }

  handleDropdown = (e) =>{
    this.setState({
      [e.target.name] : e.target.value,
      ...(e.target.name === 'year_value' && e.target.value === '' ? {month_value: '', date_value: '', showMonthDropdown: false, showDayDropdown: false} : {})
    })
  }

  handleAddMonthDropdown = () => {
    if(this.state.year_value !== ''){
      this.setState({
        showMonthDropdown: true,
        month_value: '01'
      })
    }
  }

  handleRemoveMonthDropdown = () => {
    this.setState({
      showMonthDropdown: false,
      month_value: '',
      date_value: ''
    })
  }

  handleAddDayDropdown = () => {
    if(this.state.year_value !== '' && this.state.month_value !== ''){
      this.setState({
        showDayDropdown: true,
        date_value: '01'
      })
    }
  }
  handleRemoveDayDropdown = () => {
    this.setState({
      showDayDropdown: false,
      date_value: ''
    })
  }

  resetState = () => {
    this.setState(initialState);
    this.filter_dropdown.current.value = 'category';
    this.organize_dropdown.current.value = 'full_date_time';
    this.sort_dropdown.current.value = 'asc'
  }

  getYears = (start) => {
    var years = [];
    const current = parseInt(moment().format('YYYY'));
    while(start <= current){
      years.push((start++).toString());
    } 
    return years
  }

  render() {
    var temp = []

    const { group_posts, post_count, categorized_posts, filter_attribute, search_value, sort_value, date_value, month_value, year_value, category_filter_value, organize_by_value, showMonthDropdown, showDayDropdown } = this.state;

    const categories = [{id: -1, name:'All Categories'}, {id: 0, name:'No Category'}, {id: 1, name:'ABE'}, {id: 2, name:'SPCM'}, {id: 3, name:'NASC'}, {id: 4, name:'ENG'}, {id: 5, name:'PHYS/PHYSICS'}, {id: 6, name:'HUM'}, {id: 7, name:'ARTS'}, {id: 8, name:'ECON'}, {id: 9, name:'PE'}, {id: 10, name:'CHEM'}, {id: 11, name:'ENSC'}, {id: 12, name:'NSTP'}, {id: 13, name:'MATH'}, {id: 14, name:'WIKA'}, {id: 15, name:'HNF'}, {id: 16, name:'FIL'}, {id: 18, name:'AECO'}, {id: 19, name:'STAT'}, {id: 20, name:'CHE'}, {id: 21, name:'HUME'}, {id: 22, name:'ZOO'}, {id: 23, name:'COMM'}, {id: 24, name:'SAIS-Specific'}, {id: 25, name:'Financial Concerns'}, {id: 26, name:'Form Porcessing'}, {id: 27, name:'Batch Appointment'}, {id: 28, name:'System Issues'}, {id: 29, name:'Registration Period'}, {id: 30, name:'Class Permission'}, {id: 31, name:'Plan of Study'}, {id: 32, name:'Guidelines'}, {id: 33, name:'Grades'}, {id: 34, name:'COI'}, {id: 35, name:'Lecture-Lab Concerns'}, {id: 36, name:'Units'}, {id: 37, name:'General Waitlist'}, {id: 38, name:'Explicit Need of Assistance'}, {id: 39, name:'Midyear'}, {id: 40, name:'Misc. Subjects'}, {id: 41, name:'Drop/Cancel'}]

    const dates = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31']

    const months = [{name: 'January', value: '01'}, {name: 'February', value: '02'}, {name: 'March', value: '03'}, {name: 'April', value: '04'}, {name: 'May', value: '05'}, {name: 'June', value: '06'}, {name: 'July', value: '07'}, {name: 'August', value: '08'}, {name: 'September', value: '09'}, {name: 'October', value: '10'}, {name: 'November', value: '11'}, {name: 'December', value: '12'}]

    const years = this.getYears(2016)

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
        <br />
        <div id="functions-bar" style={{display: 'flex'}}>
          <div id="search-bar" >
            <input  type="text" placeholder="Enter text" onChange={this.handleSearchChange}/>
            <button onClick={this.handleSearchSubmit}>Search</button>
          </div>

          <div>
            &nbsp;&nbsp;Filter:
            <select onChange={this.handleDropdown} name="filter_attribute" ref={this.filter_dropdown}>
              <option value="category">Category</option>
              <option value="date">Date</option>
            </select>
          </div>

          {
            filter_attribute === "date" ? (
            <div style={{display: 'flex'}}>
              <div>
                &nbsp;&nbsp;Year:
                <select onChange={this.handleDropdown} name="year_value" value={year_value}>
                <option value=''>None</option>
                {
                  years.map((year, index)=>{
                    return (
                      <option key={index} value={year}>{year}</option>
                    )
                  })
                }
                </select>
                <button onClick={this.handleAddMonthDropdown}>+</button>
              </div>


              {
                year_value !== '' && showMonthDropdown &&
                <div>
                  &nbsp;&nbsp;Month:
                  <select onChange={this.handleDropdown} value={month_value} name="month_value" value={month_value}>
                  {
                    months.map((month, index)=>{
                      return (
                        <option key={index} value={month.value}>{month.name}</option>
                      )
                    })
                  }
                  </select>
                  <button onClick={this.handleRemoveMonthDropdown}>&times;</button>
                  <button onClick={this.handleAddDayDropdown}>+</button>
                </div>
              }

              {
                year_value !== '' && month_value !== '' && showDayDropdown &&
                <div>
                  &nbsp;&nbsp;Day:
                  <select onChange={this.handleDropdown} name="date_value" value={date_value}>
                  {
                    dates.map((date, index)=>{
                      return (
                        <option key={index} value={date}>{date}</option>
                      )
                    })
                  }
                  </select>
                  <button onClick={this.handleRemoveDayDropdown}>&times;</button>
                </div>
              }
              
            </div>
            ) : (
            <div>
              &nbsp;&nbsp;Category Filter:
              <select onChange={this.handleDropdown} name="category_filter_value" value={category_filter_value}>
              {
                categories.map((category)=>{
                  return (
                    <option key={category.id} value={category.id.toString()}>{category.name}</option>
                  )
                })
              }
              </select>
            </div>
            )
          }
          <div>
            &nbsp;&nbsp;Organize By:
            <select onChange={this.handleDropdown} name="organize_by_value" ref={this.organize_dropdown}>
              <option value='full_date_time'>Date</option>
              <option value='label_id'>Category</option>
            </select>
          </div>
          <div>
            &nbsp;&nbsp;Sort:
            <select onChange={this.handleDropdown} name="sort_value" ref={this.sort_dropdown}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div>
            &nbsp;&nbsp;
            <button onClick={this.resetState}>RESET</button>
          </div>
        </div>
        {/*<h3>Post (w/ message) Count: {post_count}</h3>*/}
        
        <ol>
          {
            _.chain(categorized_posts)
            .filter(post => {
              if(search_value !== ''){
                var text = post.message.toLowerCase();
                var input = search_value.toLowerCase();

                if(text.includes(input)){
                  return post
                }
              }else{
                return post
              }
            })
            .filter(
              {...(date_value !== '' ? {'date': date_value} : {}), ...(month_value !== '' ? {'month': month_value} : {}), ...(year_value !== '' ? {'year': year_value} : {})}, ...(category_filter_value !== '-1' ? {'label_id': category_filter_value} : {})
            )
            .orderBy(organize_by_value, sort_value)
            .map((post, index) => {
              return (
                <li key={index}>
                  <div>
                    <a href={post.url}>{post.message}</a>
                    <br />
                    Date Posted: {post.full_date_time}
                    <br />
                    Label ID: {post.label_id}
                    <br />
                    Category: {post.topic}
                    <br />
                    Confidence: {post.confidence}
                  </div>
                </li>
              )
            }).value()
          }
        </ol>
        {<pre>{JSON.stringify(this.state, null, 2)}</pre>}
      </div>
    );
  }
}

export default App;

