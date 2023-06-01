import { FormEvent } from "react";

async function create(elemnt: FormEvent<HTMLFormElement>) {
  elemnt.preventDefault();
  const inputs = Array.from(elemnt.currentTarget.querySelectorAll("input"));
  const username = inputs.find(e => e.name === "username").value;
  const email = inputs.find(e => e.name === "email").value;
  const password = inputs.find(e => e.type === "password").value;

  const onCreate = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  });
  if (onCreate.status === 201) return; location.href = "/login";
  elemnt.currentTarget.querySelector("errorsMessage").textContent = (await onCreate.json()).error;
}

export default function RegisterPage() {
  return <>
    <div id="errorsMessage"></div>
    <form onSubmit={create}>
      <div>
        <label>Username:</label>
        <input type="text" name="username" />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" name="email" />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" />
      </div>
      <input type="submit" value="Create" />
    </form>
  </>;
}