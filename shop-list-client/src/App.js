import React, { Component } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import qs from 'qs';

const clientId = 'confidentialApplication';
const clientSecret = 'topSecret';
//const baseUri = 'https://us-central1-fir-demo-b463a.cloudfunctions.net';
const baseUri = 'http://localhost:5000/fir-demo-b463a/us-central1';

axios.defaults.baseURL = baseUri;
//axios.defaults.headers.common['Authorization'] = 'Bearer 7cfa18e43009c2a2d656e8cebccb993398181f3b';
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      buyItems: [],
      message: ''
    }
  }

  componentWillMount() {
    console.log('componentWillMount')

  }

  componentDidMount() {
    console.log('componentDidMount')

    const data = { 'grant_type': 'client_credentials' };
    const authData = clientId+':'+clientSecret;
    let buff = new Buffer(authData);
    let base64data = buff.toString('base64');
    console.log('"' + data + '" converted to Base64 is "' + base64data + '"');
    const options = {
      method: 'POST',
      headers: { 'Authorization': 'Basic '+base64data, 'content-type': 'application/x-www-form-urlencoded' },
      data: qs.stringify(data),
      url: baseUri+'/oauth'
    };
    return axios(options).then((response) => {
      console.log('OAuth response:', response);
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.accessToken; // Apply access token for all requests

      return axios.get(baseUri + '/getItems').then((response) => {
        this.setState({
          buyItems: response.data
        })
      }).catch(err => {
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(err.response.data);
          console.log(err.response.status);
          console.log(err.response.headers);
          alert(err.response.data.message);
        } else if (err.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(err.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', err.message);
        }
        console.log(err.config);
      });
    }).catch(err => {
      console.log(err);
    })
  }

  addItem(event) {
    event.preventDefault()
    const { buyItems } = this.state;
    const newItem = this.newItem.value;

    const isOnTheList = buyItems.includes(newItem)

    if (isOnTheList) {
      this.setState({
        message: 'This item is already on the list'
      })

    } else {
      return newItem !== '' && axios.post(baseUri + '/addItem', { item: newItem }).then((response) => {
        this.setState({
          buyItems: response.data,
          message: ''
        })
        this.addForm.reset()
      })
    }

  }

  removeItem(item){
    const newBuyItems = this.state.buyItems.filter(buyItems => {
      return item !== buyItems
    })

    return axios.delete(baseUri + `/deleteItem?id=${item.id}`).then((response) => {
      this.setState({
        buyItems: response.data
      })
    })

    if(newBuyItems.length === 0){
      this.setState({
        message: 'No Item on the list, add some'
      })
    }
  }

  clearAll(){
    this.setState({
      buyItems: [],
      message: 'No Item on the list, add some'
    })
  }

  renderItems() {
    let id = 1;
    const { buyItems, message } = this.state;

    return (
      buyItems.length > 0 &&
      <table className="table">
        <caption>Shopping List</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Item</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {
            buyItems.map(item => {
              return (
                <tr key={item.id}>
                  <th scope="row">{id++}</th>
                  <td>{item.item}</td>
                  <td>
                    <button onClick={(e) => this.removeItem(item)}  type="button" className="btn btn-default btn-sm">
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })
          }
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2">&nbsp;</td>
            <td>
              <button onClick={(e) => this.clearAll()}
              className="btn btn-default btn-sm">Clear List</button>
            </td>
          </tr>
        </tfoot>
      </table>
    )
  }



  render() {
    const { buyItems, message } = this.state;
    return (
      <div className="container">
        <h1>Shopping List</h1>
        <div className="content">

          <form ref={input => {this.addForm = input}} className="form-inline" onSubmit={this.addItem.bind(this)}>
            <div className="form-group">
              <label htmlFor="newItemInput" className="sr-only">Add New Item</label>
              <input ref={input => {this.newItem = input}}
                type="text" className="form-control" id="newItemInput" />
            </div>
            <button className="btn btn-primary">Add</button>
          </form>
          {
            (message !== '' || buyItems.length === 0) && <p className="message text-danger">{message}</p>
          }

         {this.renderItems()}

        </div>
      </div>
    );
  }
}

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
