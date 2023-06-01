import { FormEvent } from "react";

async function onLogin(elemnt: FormEvent<HTMLFormElement>) {
  elemnt.preventDefault();
  const inputs = Array.from(elemnt.currentTarget.querySelectorAll("input"));
  const username = inputs.find(e => e.name === "username").value;
  const password = inputs.find(e => e.type === "password").value;

  const onCreate = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  });
  if (onCreate.status === 200) return location.href = "/";
  return elemnt.currentTarget.querySelector("errorsMessage").textContent = (await onCreate.json()).error;
}

export default function LoginPage() {
  return <>
    <form onSubmit={onLogin}>
      <div>
        <label>Username/Email: </label>
        <input type="text" name="username" />
      </div>
      <div>
        <label>Password: </label>
        <input type="password" name="password" />
      </div>
      <input type="submit" value="Login" />
    </form>
  </>;
}