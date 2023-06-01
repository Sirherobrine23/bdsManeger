import { GetServerSidePropsContext, InferGetStaticPropsType } from "next";

export default function ServerConfig(props: InferGetStaticPropsType<typeof getServerSideProps>) {
  return <div>
    <pre>{JSON.stringify(props, null, 2)}</pre>
  </div>;
}

export async function getServerSideProps({req, params: { server_id }}: GetServerSidePropsContext) {
  // const serversData = await fetch(`http://localhost:${process.env.SERVER_PORT}/api/mcserver/server/${String(server_id)}`, {headers: req.headers as any});
  return {
    props: {
      server_id: String(server_id),
      navbarprops: [{name: "Back", path: `./`}]
    },
  };
}