export default function RegisterPage() {
  return <>
    <form action="/api/register" method="post">
      <div>
        <input type="email" name="email" />
      </div>
    </form>
  </>;
}