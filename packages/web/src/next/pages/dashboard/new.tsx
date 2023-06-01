import { FormEvent, useState } from "react";
import indexStyle from "./new.module.css";


export default function NewServer() {
  const [ currentPlatform, setPlatform ] = useState<"bedrock" | "java">("bedrock");
  const [ __lock__, setLock ] = useState<boolean>(false);
  const [ status, setStatus ] = useState<undefined|{ID: string}>();
  async function submit(form: FormEvent<HTMLFormElement>) {
    setLock(true);
    form.preventDefault();
    const platform: "bedrock" | "java" = form.currentTarget.querySelector("input[name=\"platform\"]:checked")["value"];
    const altserver: string = form.currentTarget.querySelector("select[name=\"altServer\"]")["value"];

    try {
      const installStatus = await fetch("/api/mcserver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          altServer: altserver
        }),
      });
      if (installStatus.status < 300) setStatus(await installStatus.json());
      else {
        setLock(false);
        console.error(await installStatus.json());
      }
    } catch {}
  }
  return <div>
    <form onSubmit={submit} className={indexStyle.install}>
      <div>
        <span>Select platform:</span>
        <div>
          <div>
            <input type="radio" id="bedrockPlatform" name="platform" value="bedrock" defaultChecked onClick={() => setPlatform("bedrock")} />
            <label htmlFor="bedrockPlatform"> Bedrock</label>
          </div>
          <div>
            <input type="radio" id="javaPlatform" name="platform" value="java" onClick={() => setPlatform("java")} />
            <label htmlFor="javaPlatform"> Java</label>
          </div>
        </div>
      </div>
      <div>
        <span>Select server software</span>
        <br />
        <select disabled={__lock__} name="altServer">
          <option id="mojang" defaultChecked value="mojang">
            Mojang
          </option>
          { currentPlatform === "bedrock" ?
            <option id="pocketmine" value="pocketmine">
              Pocketmine PMMP
            </option> : null
          }
          { currentPlatform === "bedrock" ?
            <option id="cloudbust" value="cloudbust">
              Cloudbust
            </option> : null
          }
          { currentPlatform === "bedrock" ?
            <option id="nukkit" value="nukkit">
              Nukkit
            </option> : null
          }
          { currentPlatform === "bedrock" ?
            <option id="powernukkit" value="powernukkit">
              Powernukkit
            </option> : null
          }
          { currentPlatform === "java" ?
            <option id="spigot" value="spigot">
              Spigot MC
            </option> : null
          }
          { currentPlatform === "java" ?
            <option id="paper" value="paper">
              Paper MC
            </option> : null
          }
          { currentPlatform === "java" ?
            <option id="purpur" value="purpur">
              Purpur MC
            </option> : null
          }
          { currentPlatform === "java" ?
            <option id="glowstone" value="glowstone">
              Glowstone
            </option> : null
          }
          { currentPlatform === "java" ?
            <option id="folia" value="folia">
              folia
            </option> : null
          }
          { currentPlatform === "java" ?
            <option id="cuberite" value="cuberite">
              Cuberite
            </option> : null
          }
        </select>
      </div>

      <div>
        <input disabled={__lock__} type="submit" value="Install" />
      </div>
    </form>
    <div style={{textAlign: "center"}}>
      { !status ? <div></div> : <div>
        <span>{status.ID}</span>
        <br />
        <a href={`/dashboard/${status.ID}`}>Open painel</a>
      </div> }
    </div>
  </div>;
}