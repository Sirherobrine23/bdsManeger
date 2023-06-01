import { InferGetStaticPropsType } from "next";
import { useState } from "react";
import homeStyle from "./index.module.css";

export default function Dashboard(props: InferGetStaticPropsType<typeof getServerSideProps>) {
  const [ server, updateServer ] = useState(props.servers);
  const refresh = () => fetch("/api/mcserver").then(res => res.json().then(data => ({data, res}))).then(data => data.res.status < 300 ? updateServer(data.data) : data.res);

  return <div>
    <button style={{display: "none"}} id="refreshServers" onClick={refresh}>Refresh Servers</button>
    <div className={homeStyle["ServersGrid"]}>
      {server.map((value) => {
        return <div key={JSON.stringify(value)} className={homeStyle["serverModule"]} onClick={() => {
          const a = document.createElement("a");
          a.href = `/dashboard/${value.ID}`;
          a.click();
        }}>
          <div style={{textAlign: "center"}}>
            <a href={`/dashboard/${value.ID}`}>{value.name}</a>
          </div>
          <br />
          <div>Platform: {value.platform.slice(0, 1).toUpperCase()}{value.platform.slice(1)}</div>
          <div>Status: <span style={{color: value.running ? "green" : "red"}}>{value.running ? "Avaible" : "Stoped"}</span></div>
        </div>;
      })}
    </div>
  </div>;
}

Dashboard.navBar = [
  {
    name: "New server",
    path: "/dashboard/new"
  },
  {
    name: "Refresh",
    action: () => document.querySelector("#refreshServers")["click"](),
  }
]

export async function getServerSideProps({req}) {
  const serversData = await fetch(`http://localhost:${process.env.SERVER_PORT}/api/mcserver`, {headers: req.headers as any});
  return {
    props: {
      servers: (await serversData.json()) as {
        ID: string,
        platform: "bedrock"|"java",
        name: string,
        running: boolean
      }[],

    },
  };
}