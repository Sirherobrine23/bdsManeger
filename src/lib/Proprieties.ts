export default parse;
export function parse(Proper: string): {[key: string]: string|number|true|false|null} {
  const ProPri = {};
  const ProperSplit = Proper.replace(/\r\n/g, "\n").replace(/\\\n/gi, "").split("\n").map(Line => Line.trim()).filter(line => /.*(\s+)?\=(\s+)?.*/.test(line) && !/^#/.test(line));
  for (const Line of ProperSplit) {
    const LineMatch = Line.match(/^([^\s\=]+)\s*\=(.*)$/);
    const key = LineMatch[1].trim(), value = LineMatch[2].trim();
    ProPri[key] = value;
    if (ProPri[key] === "") ProPri[key] = null;
    else if (ProPri[key] === "true") ProPri[key] = true;
    else if (ProPri[key] === "false") ProPri[key] = false;
    else if (/^[0-9]+\.[0-9]+/.test(ProPri[key]) && !/^[0-9]+\.[0-9]+\.[0-9]+/.test(ProPri[key])) ProPri[key] = parseFloat(ProPri[key]);
    else if (/^[0-9]+/.test(ProPri[key])) ProPri[key] = parseInt(ProPri[key]);
  }
  return ProPri;
}

export function stringify(ProPri: {[key: string]: any}): string {
  const Proper = [];
  for (const key in Object.keys(ProPri)) {
    if (ProPri[key] === null) Proper.push(`${key}=`);
    else if (ProPri[key] === true) Proper.push(`${key}=true`);
    else if (ProPri[key] === false) Proper.push(`${key}=false`);
    else if (typeof ProPri[key] === "number") Proper.push(`${key}=${ProPri[key]}`);
    else if (typeof ProPri[key] === "string") Proper.push(`${key}=${ProPri[key]}`);
    else if (typeof ProPri[key] === "object") Proper.push(`${key}=${JSON.stringify(ProPri[key])}`);
    else console.error(`[Proprieties.stringify] ${key} is not a valid type.`);
  }
  return Proper.join("\n");
}