import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(({res, next}) => {
  res.json = (body) => {
    res.set("Content-Type", "application/json");
    res.send(JSON.stringify(body, (key, value) => {
      if (typeof value === "bigint") value = value.toString();
      return value;
    }, 2));
    return res;
  }
  return next();
});

app.use((req, res, next)=>{
  const session = (req["session"]||{});
  if(!session.user) {
    if(req.headers.authorization) {
      const auth_stuff = Buffer.from(req.headers.authorization.split(" ")[1], "base64")
      const [user, password] = auth_stuff.toString().split(":")
      if(user === process.env.AUTH_USER && password === process.env.AUTH_PASSWORD) {
        session.user = process.env.AUTH_USER
        return next();
      }
    }
  }
  res.setHeader("WWW-Authenticate", "Basic")
  return res.sendStatus(401);
});
export default app;