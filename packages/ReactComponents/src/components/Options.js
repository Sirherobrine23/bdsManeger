import { Component } from "react";

class Global_Server_Proprieties extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    <>
      <div className="BdsGlobalServerProprieties">
        <div>
          <select className="BdsSelectDifficultySelect" onChange={this.props.Difficulty_onChange}>
            <option defaultValue="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <input type="text" className="BdsInputWorldName" placeholder="World Name" onChange={this.props.WorldName_onChange} />
        </div>
        <div>
          <input type="text" className="BdsInputWorldDescription" placeholder="World Description" onChange={this.props.WorldDescription_onChange} />
        </div>
        <div>
          <input type="number" className="BdsInputWorldMaxPlayers" placeholder="Max Players" onChange={this.props.WorldMaxPlayers_onChange} />
        </div>
        <div>
          <input type="number" className="BdsInputServerPortv4" placeholder="Server Port" onChange={this.props.ServerPortv4_onChange} />
        </div>
        {
          this.props.EnableIPv6 ? (<div>
            <input type="number" className="BdsInputServerPortv6" placeholder="Server Port (IPv6)" onChange={this.props.ServerPortv6_onChange} />
          </div>) : null
        }
        <div>
          <label>Allow Commands:</label> <input type="checkbox" className="BdsInputAllowCommands" onChange={this.props.AllowCommands_onChange} />
        </div>
        <div>
          <label>Allow Cheats:</label> <input type="checkbox" className="BdsInputAllowCheats" onChange={this.props.AllowCheats_onChange} />
        </div>
      </div>
    </>
  }
}

export default Global_Server_Proprieties;
export { Global_Server_Proprieties };