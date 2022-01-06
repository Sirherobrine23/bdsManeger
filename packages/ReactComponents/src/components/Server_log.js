import Socket_io_client from "socket.io-client";
import Node_Fetch from "node-fetch";
import { Component } from "react";


class Static_Log extends Component {
  constructor(props) {
    super(props);
    this.state = {
      log: []
    };
  }
  componentDidMount() {
    const Props = this.props;
    (async () => {
      const Log  = await (await Node_Fetch(`http://${Props.API_HOST}:${Props.API_PORT}/bds/log`)).json();
      this.setState({
        log: Log
      });
    })();
  }
  render() {
    return (
      <>
      {
        this.state.log.map((Log_Line, ArrayIndexNumber) => {
          return (
            <div key={ArrayIndexNumber} className="BdsLog">
              <span className="BdsLogLine">{Log_Line}</span>
            </div>
          );
        })
      }
      </>
    )
  }
}

class Dynamic_Log extends Component {
  constructor(props) {
    super(props);
    this.Socket_io_Client = Socket_io_client(`http://${this.props.API_HOST}:${this.props.API_PORT}`, {
      query: {
        token: this.props.token,
        Token: this.props.token,
      }
    });
    this.ServerLog = [];
    this.state = {
      log: this.ServerLog
    }
  }
  componentDidMount() {
    this.Socket_io_Client.on("ServerLog", (LogObject) => {
      this.ServerLog.push(...(LogObject.data.split(/\r\n|\n/gi)));
      this.setState({
        log: this.ServerLog
      });
    });
  }
  render() {
    return (
      <>
      {
        this.state.log.map((Log_Line, ArrayIndexNumber) => {
          return (
            <>
              <div key={ArrayIndexNumber} className="BdsLog">
                <span className="BdsLogLine">{Log_Line}</span>
              </div>
            </>
          )
        })
      }
      </>
    )
  }
}


export default Dynamic_Log;
export { Static_Log, Dynamic_Log };