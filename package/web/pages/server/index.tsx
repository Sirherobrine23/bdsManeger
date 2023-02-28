import { InferGetStaticPropsType, NextPageContext } from "next";
import auth from "../../libs/auth";

export default function ServerIndex(props: InferGetStaticPropsType<typeof getServerSideProps>) {
  return <></>;
}

export async function getServerSideProps(req: NextPageContext) {
  const authenticated = await auth(req.req);
  if (authenticated) return {
    redirect: {
      destination: "/login"
    }
  };
  return {
    props: {}
  }
}