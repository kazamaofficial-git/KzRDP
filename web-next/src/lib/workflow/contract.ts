import {parse} from "yaml";
import {defaults,choices,boolKeys} from "./workflow";
export function workflowCompatible(source:string):boolean {
 if(source.length>1_000_000||!/^# kzrdp-workflow-schema: 6\s*$/m.test(source))return false;
 try {
  const doc=parse(source,{maxAliasCount:20});
  const inputs=doc?.on?.workflow_dispatch?.inputs;
  if(!inputs||typeof inputs!=="object")return false;
  for(const key of Object.keys(defaults)){
   if(!Object.prototype.hasOwnProperty.call(inputs,key))return false;
   const spec=inputs[key];
   if(boolKeys.includes(key)){if(spec?.type!=="boolean")return false;}
   else if(choices[key]){if(spec?.type!=="choice"||!Array.isArray(spec.options)||!choices[key].every(v=>spec.options.includes(v)))return false;}
   else if(spec?.type!=="string")return false;
  }
  // token + email + username GitHub adalah gerbang build: wajib ada bertipe string.
  if(inputs.token?.type!=="string"||inputs.email?.type!=="string"||inputs.github?.type!=="string")return false;
  return !Object.entries(inputs).some(([key,spec])=>!Object.prototype.hasOwnProperty.call(defaults,key)&&!["token","email","github"].includes(key)&&!!(spec as {required?:boolean})?.required);
 }catch{return false;}
}
