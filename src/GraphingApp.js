import React, { Component } from 'react';
import config from './config';
import { load } from './helpers/spreadsheet';
import { PacmanLoader } from 'react-spinners';
import { keys, map, max, sum } from 'lodash';
import Moment from 'moment';
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory';

import './GraphingApp.scss';

let GoogleAuth;

document.title = "Project Lob Temperatures";

class GraphingApp extends Component {
  state = {
    loadingMessage: "Loading...",
    tankData: {},
    error: null,
    isAuthorized: false,
    currentApiRequest: null,
    chartStyles: {
      1: {
        data: { stroke: 'green' }
      },
      2: {
        data: { stroke: 'darkorange' }
      },
      3: {
        data: { stroke: 'lightblue' }
      },
    }
  };
  componentDidMount() {
    // 1. Load the JavaScript client library.
    window.gapi.load("client", this.initClient);
  }

  render() {
    if (this.state.loadingMessage) {
      return this.renderLoading();
    }
    if (this.state.error ) {
      return <div>{this.state.error.message}</div>;
    }
    if (keys(this.state.tankData).length > 0) {
      window.data = this.state.tankData;
    }
    window.component = this;
    return (
      <div className="tank-graphing" style={{display: 'flex', flexDirection: 'column'}}>
        <span className="header">Project Lob Tank Readings</span>
        <div
          className="reload-button"
          onClick={() => {
            this.setState({ loadingMessage: "Reloading data" }); load(this.onLoad)
          }}
        >
          Reload Tank Data
        </div>
        <div className="tank-details-container">
          {
            map(keys(this.state.tankData), (tank) => (
              this.renderTankDetails(tank)
            ))
          }
        </div>
        <div className="tank-chart">
          <VictoryChart theme={VictoryTheme.material} domain={{ y: [0, 30] }} height={500} width={800}>
          {
            map(keys(this.state.tankData), (tank) => {
              const lineData = map(this.state.tankData[tank], (reading, index) => {
                return { x: index, y: reading.temp }
              });
              return (
                <VictoryLine
                  interpolation='natural'
                  data={lineData}
                  style={this.state.chartStyles[tank]}
                  sortKey='x'
                  key={`line-${tank}`}
                />
              )
            })
          }
          </VictoryChart>
        </div>
      </div>
    )
  }

  renderLoading = () => {
    return (
      <div className="tank-graphing loading">
        <div className="pacman">
          <PacmanLoader loading={true} />
        </div>
        <span className="loading-message">{this.state.loadingMessage}</span>
      </div>
    );
  }

  renderTankDetails = (tank) => {
    const readings = this.state.tankData[tank];
    const temps = map(readings, (reading) => ( reading.temp ));
    const maxTemp = max(temps);
    const avg = (sum(temps) / temps.length).toFixed(2);
    const lastReading = readings[readings.length - 1];
    return (
      <div className={`tank-details tank-details-${tank}`} style={{ background: this.state.chartStyles[tank].data.stroke }} key={`tank-details-${tank}`}>
        <span className="tank-details-header">{`Tank ${tank} Details`}</span>
        <div className="tank-details-rows">
          <div className="tank-details-row">
            <span>{`Last Temperature: ${temps[temps.length - 1]}`}</span>
          </div>
          <div className="tank-details-row">
            <span>{`Average Temperature: ${avg}`}</span>
          </div>
          <div className="tank-details-row">
            <span>{`Max Temperature: ${maxTemp}`}</span>
          </div>
          <div className="tank-details-row">
            <span>{`Last Reading: ${lastReading.date} - ${lastReading.time}`}</span>
          </div>
        </div>
      </div>
    )
  }

  genDataObject = (dataList) => {
    return {
      date: dataList[0],
      time: dataList[1],
      year: dataList[2],
      month: dataList[3],
      day: dataList[4],
      tank: dataList[5],
      temp: parseFloat(dataList[6]),
      timestamp: Moment(`${dataList[2]}-${dataList[3]}-${dataList[4]} ${dataList[1]}`).format('x'),
    };
  }

  initClient = () => {
    this.setState({ loadingMessage: "Fetching Data" });
    // 2. Initialize the JavaScript client library.
    window.gapi.client
      .init({
        apiKey: "AIzaSyBVm3YG9Vd-ImKW7dGEJZun2L4jFUT738w",
        // Your API key will be automatically added to the Discovery Document URLs.
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: config.scope,
      }).then(() => {
        load(this.onLoad)
      });
  };

  sendAuthorizedApiRequest = (request) => {
    this.setState({ currentApiRequest: request });
    console.log("request!");
    if (this.state.isAuthorized) {
      console.log("making request!");
      request();
      this.setState({ currentApiRequest: null });
    } else {
      console.log("signing in from request!");
      GoogleAuth.signIn();
    }
  }

  updateSigninStatus = (isSignedIn) => {
    console.log("after signin!");
    if (isSignedIn) {
      console.log("Authorized!");
      this.setState({ isAuthorized: true });
      if (this.state.currentApiRequest) {
        this.sendAuthorizedApiRequest(this.state.currentApiRequest);
      }
    } else {
      console.log("Not Authorized!");
      this.setState({ isAuthorized: false });
    }
  }

  onLoad = (data, error) => {
    if (data) {
      this.setState({ loadingMessage: "Parsing Data" });
      this.parseData(data);
    } else {
      this.setState({ error, loadingMessage: null });
    }
  }

  parseData = (data) => {
    const tanks = {
      1: [],
      2: [],
      3: [],
    };
    map(data.data.slice(-72), (reading) => {
      const obj = this.genDataObject(reading);
      tanks[obj.tank].push(obj);
    });
    this.setState({tankData: tanks});
    this.setState({ loadingMessage: null });
  }
}

export default GraphingApp;
