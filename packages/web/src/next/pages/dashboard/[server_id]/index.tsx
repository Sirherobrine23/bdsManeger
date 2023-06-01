import { GetServerSidePropsContext, InferGetStaticPropsType } from "next";
import { useState } from "react";

export default function Maneger(props: InferGetStaticPropsType<typeof getServerSideProps>) {
  const [ stats, updateStats ] = useState(props.server);
  return <div>
    <pre>{JSON.stringify(stats, null, 2)}</pre>
  </div>;
}

export async function getServerSideProps({req, params: { server_id }}: GetServerSidePropsContext) {
  const serversData = await fetch(`http://localhost:${process.env.SERVER_PORT}/api/mcserver/server/${String(server_id)}`, {headers: req.headers as any});
  return {
    props: {
      server_id: String(server_id),
      server: await serversData.json(),
      navbarprops: [{name: "Settings", path: `${server_id}/settings`}]
    },
  };
}