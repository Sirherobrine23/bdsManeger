export type properitiesBase = {[key: string]: string|number|true|false};

/**
 * Parse Proprieties files and return a map of properties.
 *
 * @param Proper - String with the properties or similar files
 * @returns
 */
export function parse<PropertiesObject = properitiesBase>(Proper: string): PropertiesObject {
  const ProPri = {};
  const ProperSplit = Proper.replace(/\\\s+?\n/gi, "").split(/\r?\n/).map(Line => Line.trim()).filter(line => /.*(\s+)?\=(\s+)?.*/.test(line) && !/^#/.test(line));
  for (const Line of ProperSplit) {
    const LineMatch = Line.match(/^([^\s\=]+)\s*\=(.*)$/);
    const key = LineMatch[1].trim(), value = LineMatch[2].trim();
    ProPri[key] = value;
    if (ProPri[key] === "true") ProPri[key] = true;
    else if (ProPri[key] === "false") ProPri[key] = false;
    else if (/^[0-9]+\.[0-9]+/.test(ProPri[key]) && !/^[0-9]+\.[0-9]+\.[0-9]+/.test(ProPri[key])) ProPri[key] = parseFloat(ProPri[key]);
    else if (/^[0-9]+/.test(ProPri[key])) ProPri[key] = parseInt(ProPri[key]);
  }
  return ProPri as PropertiesObject;
}

/**
 * Convert json to properities files.
 *
 * @param ProPri - String with properties file
 * @returns
 */
export function stringify(ProPri: properitiesBase): string {
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

export default {parse, stringify};