import "../style/_app.css";
import Head from "next/head";

export default function ManegerMain({ Component, pageProps }) {
  return (
    <div>
      <Head>
        <title>Server Maneger WEB</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link href="/img/mcpe.png" rel="icon" type="image/x-icon" />
        <link href="/img/mcpe.ico" rel="icon" type="image/x-icon" />
      </Head>
      <div>
        <Component {...pageProps} />
      </div>
    </div>
  )
}