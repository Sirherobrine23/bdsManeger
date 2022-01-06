import { Component } from "react";
import Node_Fetch from "node-fetch";

class Select_Platform extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Platforms: [],
    };
  }
  componentDidMount() {
    (async () => {
      const Platforms = await (await Node_Fetch(`http://${this.props.API_HOST}:${this.props.API_PORT}/bds/info/server`)).json();
      this.setState({
        Platforms: Platforms.Platform_available
      });
    })();
  }
  render() {
    return (
      <>
        <div className="BdsSelectPlatform">
          <select className="BdsSelectPlatformSelect" onChange={this.props.onChange}>
            {
              this.state.Platforms.map((Platform, ArrayIndexNumber) => {
                return (
                  <>
                    <option key={ArrayIndexNumber} value={Platform}>{Platform}</option>
                  </>
                )
              })
            }
          </select>
        </div>
      </>
    )
  }
}

export default Select_Platform;
export { Select_Platform };