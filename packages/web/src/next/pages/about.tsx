import corepkg from "@the-bds-maneger/core/package.json";
// @ts-ignore
import pkg from "../../../package.json";
import Style from "./about.module.css";

export default function Home() {
  return <div className={Style.about}>
    <div>
      Bds maneger WEB Dashboard
    </div>
    <div>
      This is a project of several Projects by Matheus Sampaio Queiroga (<a href="https://github.com/Sirherobrine23">@Sirherobrine23</a>)
    </div>
    <br />
    <div>
      <div>Dashboard version <span className={Style["version"]}>{pkg.version}</span></div>
      <div>Core version <span className={Style["version"]}>{corepkg.version}</span></div>
    </div>
  </div>;
}