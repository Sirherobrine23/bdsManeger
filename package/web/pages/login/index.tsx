import { InferGetStaticPropsType, NextPageContext } from "next";
import { useRef, useState } from "react";
import auth from "../../libs/auth";

export default function ServerIndex(props: InferGetStaticPropsType<typeof getServerSideProps>) {
  const authPrim = useRef<HTMLInputElement>(null);
  const emailPassword = useRef<HTMLInputElement>(null);
  const [ isPassword, enablePassword ] = useState(false);
  async function authButton() {
    const emailToken = String(authPrim.current?.value || "");
    const password = String(emailPassword.current?.value || "");
    if (!emailToken) return;
    if (!emailToken.startsWith("bdstoken_")) {
      if (isPassword === false) enablePassword(true);
      else {
        if (password.length <= 8) {
          console.log({
            email: authPrim,
            password: emailPassword
          });
        }
      }
    } else {
      console.log("Token:", emailToken);
    }
  }
  return <div>
    <div>
      <input type="text" ref={authPrim}></input>
    </div>
    <div style={{display: isPassword ? "block" : "none"}}>
      <input type="password" ref={emailPassword}></input>
    </div>
    <div>
      <button onClick={authButton}>Login</button>
    </div>
  </div>;
}

export async function getServerSideProps(req: NextPageContext) {
  const authenticated = await auth(req.req);
  if (!authenticated) return {
    redirect: {
      destination: "/"
    }
  };
  return {
    props: {}
  }
}