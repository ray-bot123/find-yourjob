import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
const python=process.env.PYTHON || (process.platform==='win32'?'python':'python3');
const children=[];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill();process.exitCode=code;}
for(const [command,args] of [[process.execPath,['server.mjs']],[python,['resume_service.py']],[python,['ai_service.py']]]){
 const child=spawn(command,args,{stdio:'inherit',windowsHide:true});children.push(child);
 child.on('error',error=>{console.error('Could not start service:',error.message);stop(1);});
 child.on('exit',code=>{if(!stopping)stop(code||1);});
}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
console.log('Open http://localhost:4175/#/discover. Ctrl+C stops all services.');
