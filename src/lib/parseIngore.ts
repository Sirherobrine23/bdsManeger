export default function parse(ignoreFile: string, filter?: Array<string>) {
  ignoreFile = ignoreFile.replace(/\r\n/g, "\n").replace(/#.*\n?/gim, "").replace(/^\n/g, "").replace(/\*\*/g, "(.+)").replace(/\*/g, "([^\\/]+)");
  const allow = (([...ignoreFile.matchAll(/!.*\n?/g)])||[]).filter(x => !!x);
  ignoreFile = ignoreFile.replace(/!.*\n?/gim, "").replace(/^\n/g, "");
  const ignore = ignoreFile.split(/\n/g);
  const objIngore = {
    allow: allow.length > 0 ? new RegExp("^((" + allow.join(")|(") + "))") : new RegExp("$^"),
    ignore: ignore.length > 0 ? new RegExp("^((" + ignore.join(")|(") + "))") : new RegExp("$^"),
  };
  if (!filter) return objIngore;
  else return filter.filter(x => objIngore.allow.test(x) && !objIngore.ignore.test(x));
}