export default function LoginPage() {
  return <>
    <form action="/api/login" method="post">
      <div>
        <label>Username/Email: </label>
        <input type="text" name="username" />
      </div>
      <div>
        <label>Password: </label>
        <input type="password" name="password" />
      </div>
    </form>
  </>;
}