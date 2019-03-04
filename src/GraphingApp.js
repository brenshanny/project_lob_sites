import React, { Component } from 'react';
import config from './config';
import { load } from './helpers/spreadsheet';
import { PacmanLoader } from 'react-spinners';
import { keys, map, max, min, sum } from 'lodash';
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
      4: {
        data: { stroke: 'red' }
      },
      5: {
        data: { stroke: 'yellow' }
      },
      6: {
        data: { stroke: 'purple' }
      },
      7: {
        data: { stroke: 'black' }
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
    if (this.state.error) {
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
            this.setState({ loadingMessage: "Reloading data" }); this.reloadTemps()
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
    if (readings.length === 0) {
      return null;
    }
    const temps = map(readings, (reading) => ( reading.temp ));
    const maxTemp = max(temps);
    const minTemp = min(temps);
    const avg = (sum(temps) / temps.length).toFixed(2);
    const lastReading = readings[readings.length - 1];
    return (
      <div className={`tank-details tank-details-${tank}`} style={{ background: this.state.chartStyles[tank].data.stroke }} key={`tank-details-${tank}`}>
        <div className="tank-details-inner">
          <span className="tank-details-header">{`Tank ${tank} Details`}</span>
          <div className="tank-details-rows">
            <div className="tank-details-row">
              <span className="tank-last-temperature">
                {temps[temps.length - 1]}
                <span className="temp-indicator-degrees">o</span>
                <span className="temp-indicator-celcius">C</span>
              </span>
              <span className="tank-last-time">{lastReading.date} - {lastReading.time}</span>
            </div>
            <div className="tank-details-row">
              <span>{`Average: ${avg}`}</span>
            </div>
            <div className="tank-details-row">
              <span>{`Max: ${maxTemp}`}</span>
            </div>
            <div className="tank-details-row">
              <span>{`Min: ${minTemp}`}</span>
            </div>
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
        this.reloadTemps();
      });
  };

  reloadTemps = () => {
    load('Hot', this.onHotTempLoad)
    load('Cold', this.onColdTempLoad)
  }

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

  onHotTempLoad = (data, error) => {
    if (data) {
      this.setState({ loadingMessage: "Parsing Data" });
      this.parseHotData(data);
    } else {
      this.setState({ error, loadingMessage: null });
    }
  }

  onColdTempLoad = (data, error) => {
    if (data) {
      this.setState({ loadingMessage: "Parsing Data" });
      this.parseColdData(data);
    } else {
      this.setState({ error, loadingMessage: null });
    }
  }

  parseHotData = (data) => {
    if (!data.data) {
      this.setState({ loadingMessage: null });
      return;
    }
    const tanks = {
      1: [],
      2: [],
      3: [],
    };
    map(data.data.slice(-72), (reading) => {
      const obj = this.genDataObject(reading);
      tanks[obj.tank].push(obj);
    });
    const { tankData } = this.state;
    map(keys(tanks), (tank) => {
      tankData[tank] = tanks[tank];
    });
    this.setState({ tankData: tankData });
    this.setState({ loadingMessage: null });
  }

  parseColdData = (data) => {
    if (!data.data) {
      this.setState({ loadingMessage: null });
      return;
    }
    const tanks = {
      4: [],
      5: [],
      6: [],
      7: [],
    };
    map(data.data.slice(-96), (reading) => {
      const obj = this.genDataObject(reading);
      tanks[obj.tank].push(obj);
    });
    const { tankData } = this.state;
    map(keys(tanks), (tank) => {
      tankData[tank] = tanks[tank];
    });
    this.setState({ tankData: tankData });
    this.setState({ loadingMessage: null });
  }
}

export default GraphingApp;
