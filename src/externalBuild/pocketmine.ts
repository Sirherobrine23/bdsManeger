import fsOld from "node:fs";
import fs from "node:fs/promises";
import admZip from "adm-zip";
import { execFileAsync } from "../childPromisses";
import { saveFile } from "../httpRequest";
import { promisify } from "node:util";
import path from "node:path";

var PHP_MAJOR_VER = "8.0"
var PHP_VER = `${PHP_MAJOR_VER}.22`
var PHP_GIT_REV = `php-${PHP_VER}`
var PHP_DISPLAY_VER = PHP_VER
var PHP_SDK_VER = "2.2.0"
var VC_VER = "vs16"
var ARCH = "x64"
var VS_VER = ""
var VS_YEAR = ""
var CMAKE_TARGET = ""
var PHP_DEBUG_BUILD = "0";
var MSBUILD_CONFIGURATION = "RelWithDebInfo"

var LIBYAML_VER = "0.2.5"
var PTHREAD_W32_VER = "3.0.0"
var LEVELDB_MCPE_VER= "1c7564468b41610da4f498430e795ca4 de0931ff"
var LIBDEFLATE_VER= "b01537448e8eaf0803e38bdba5acef1d 1c8effba"

var PHP_PTHREADS_VER = "4.1.3"
var PHP_YAML_VER = "2.2.2"
var PHP_CHUNKUTILS2_VER = "0.3.3"
var PHP_IGBINARY_VER = "3.2.7"
var PHP_LEVELDB_VER= "317fdcd8415e1566fc2835ce2bdb8e19 b890f9f3"
var PHP_CRYPTO_VER = "0.3.2"
var PHP_RECURSIONGUARD_VER = "0.1.0"
var PHP_MORTON_VER = "0.1.2"
var PHP_LIBDEFLATE_VER = "0.1.0"
var PHP_XXHASH_VER = "0.1.1"
var PHP_XDEBUG_VER = "3.1.5"

var OUT_PATH_REL = "Release"
var PHP_HAVE_DEBUG = "enable-debug-pack"

var SOURCES_PATH = process.env.SOURCES_PATH||`C:\\pocketmine-php-${PHP_DISPLAY_VER}-release`

var VS_EDITION = process.env.VS_EDITION || "Community";
var VS_YEAR = process.env.VS_YEAR;

function getCode() {
  if (!fsOld.existsSync(`C:\\Program Files (x86)\\Microsoft Visual Studio`)) throw new Error("Please install Visual Studio");
  if (!VS_YEAR) VS_YEAR = fsOld.readdirSync("C:\\Program Files (x86)\\Microsoft Visual Studio")[0];
  if (fsOld.existsSync(`C:\\Program Files (x86)\\Microsoft Visual Studio\\${VS_YEAR}\\${VS_EDITION}\\VC\\Auxiliary\\Build\\vcvarsall.bat`)) return `C:\\Program Files (x86)\\Microsoft Visual Studio\\${VS_YEAR}\\${VS_EDITION}`;
  VS_EDITION = fsOld.readdirSync(`C:\\Program Files (x86)\\Microsoft Visual Studio\\${VS_YEAR}`)[0];
  return getCode();
}

async function get_zip(url: string, out: string) {
  await (promisify((new admZip(await saveFile(url))).extractAllToAsync))(out, false, true);
}

export default async function build(SOURCES_PATH: string) {
  if (fsOld.existsSync(SOURCES_PATH)) fs.rm(SOURCES_PATH, {recursive: true, force: true});
  console.log("Getting SDK...");
  await execFileAsync("git", ["clone", "https://github.com/OSTC/php-sdk-binary-tools.git", "-b", `php-sdk-${PHP_SDK_VER}`, "-q", "--depth=1", SOURCES_PATH], {stdio: "inherit"});
  await execFileAsync("bin\\phpsdk_setvars.bat", {stdio: "inherit"});
  console.log("Downloading PHP source version %s...", PHP_VER);
  await get_zip(`https://github.com/php/php-src/archive/${PHP_GIT_REV}.zip`, path.join(SOURCES_PATH, "php-src"));

  let DEPS_DIR_NAME="deps"
  let DEPS_DIR=`${SOURCES_PATH}\\${DEPS_DIR_NAME}`;
  await execFileAsync("bin\\phpsdk_deps.bat", ["-u", "-t", VS_VER, "-b", PHP_MAJOR_VER, "-a", process.arch, "-f", "-d", DEPS_DIR_NAME], {cwd: SOURCES_PATH, stdio: "inherit"});
  console.log("Getting additional dependencies...");
  SOURCES_PATH = path.join(SOURCES_PATH, DEPS_DIR);

  console.log("Downloading LibYAML version %s...", LIBYAML_VER);
  await get_zip(`https://github.com/yaml/libyaml/archive/${LIBYAML_VER}.zip`, path.join(SOURCES_PATH, "libyaml"));
  SOURCES_PATH = path.join(SOURCES_PATH, "libyaml");
  console.log("Generating build configuration...");
  await execFileAsync("cmake", ["-G", CMAKE_TARGET, "-A", process.arch, `-DCMAKE_PREFIX_PATH=${DEPS_DIR}`, `-DCMAKE_INSTALL_PREFIX=${DEPS_DIR}`, `-DBUILD_SHARED_LIBS=ON`, "."], {cwd: SOURCES_PATH, stdio: "inherit"});
  console.log("Compiling...");
  await execFileAsync("msbuild", ["ALL_BUILD.vcxproj", `/p:Configuration=${MSBUILD_CONFIGURATION}`, "/m"], {cwd: SOURCES_PATH, stdio: "inherit"});
  console.log("Installing files...");
  await execFileAsync("msbuild", ["INSTALL.vcxproj", `/p:Configuration=${MSBUILD_CONFIGURATION}`, "/m"], {cwd: SOURCES_PATH, stdio: "inherit"});
  fs.cp()

  SOURCES_PATH = path.join(SOURCES_PATH, DEPS_DIR);

}