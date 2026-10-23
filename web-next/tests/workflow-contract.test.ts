import {test} from 'node:test';import assert from 'node:assert/strict';
import {stringify} from 'yaml';import {workflowCompatible} from '../src/lib/workflow/contract';import {defaults,choices,boolKeys} from '../src/lib/workflow/workflow';
const inputs:Record<string,unknown>=Object.fromEntries(Object.keys(defaults).map(k=>[k,boolKeys.includes(k)?{type:'boolean'}:choices[k]?{type:'choice',options:choices[k]}:{type:'string'}]));inputs.token={type:'string'};inputs.email={type:'string'};inputs.github={type:'string'};
const source=(v:unknown)=>'# kzrdp-workflow-schema: 6\n'+stringify({on:{workflow_dispatch:{inputs:v}}});
test('workflow compatibility checks actual input names/options, not only marker',()=>{
 assert.equal(workflowCompatible(source(inputs)),true);
 const missing={...inputs};delete missing.microphone;assert.equal(workflowCompatible(source(missing)),false);
 const noToken={...inputs};delete noToken.token;assert.equal(workflowCompatible(source(noToken)),false);
 const noGithub={...inputs};delete noGithub.github;assert.equal(workflowCompatible(source(noGithub)),false);
 assert.equal(workflowCompatible(source({...inputs,microphone:{type:'choice',options:['ya','tidak']}})),false);
 assert.equal(workflowCompatible(source({...inputs,akses:{type:'choice',options:['public']}})),false);
 assert.equal(workflowCompatible(source(inputs).replace('schema: 6','schema: 2')),false);
 assert.equal(workflowCompatible(source({...inputs,new_requirement:{required:true,type:'string'}})),false);
 assert.equal(workflowCompatible('# kzrdp-workflow-schema: 6\nnot yaml ['),false);
});
