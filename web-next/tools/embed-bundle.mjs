// Mengemas bundle/ (skrip PowerShell + aset sesi) menjadi src/generated/rdp-bundle.json.
// File ini disajikan Worker hanya kepada sesi terverifikasi (/api/v1/rdp/bundle); repo publik tidak berisi skrip.
import {readdirSync,readFileSync,writeFileSync,mkdirSync,statSync} from "node:fs";
import {join,relative,extname,dirname} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const src=join(root,"bundle"),out=join(root,"src","generated","rdp-bundle.json");
const TEXT=new Set([".ps1",".json",".md",".txt"]);
const files={},blobs={};
const walk=d=>{for(const n of readdirSync(d).sort()){const p=join(d,n);if(statSync(p).isDirectory()){walk(p);continue}
  const rel=relative(src,p).split("\\").join("/"),buf=readFileSync(p),id=createHash("sha256").update(buf).digest("hex").slice(0,16);
  files[rel]=id;if(!blobs[id])blobs[id]=TEXT.has(extname(p).toLowerCase())?{enc:"utf8",data:buf.toString("utf8")}:{enc:"base64",data:buf.toString("base64")};}};
walk(src);
const version=createHash("sha256").update(JSON.stringify(files)).digest("hex").slice(0,12);
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify({version,files,blobs}));
console.log("rdp-bundle v"+version+": "+Object.keys(files).length+" berkas, "+Object.keys(blobs).length+" blob");
