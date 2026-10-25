import fs from 'node:fs';
import assert from 'node:assert/strict';
import {initialLocks,command} from '../src/learning/lockModel.ts';
import {lockRuns} from '../authoring/case-scenarios.mjs';
import {describeLocks} from './teacher-lock-routes.mjs';
const cases=JSON.parse(fs.readFileSync('authoring/cases.json','utf8'));
const stateAt=(i,run,step)=>{let s=initialLocks(cases[i].model);for(const [a,op,k]of lockRuns[i][run].steps.slice(0,step))s=command(s,a,op,k);return s};
let checks=0;
function check(i,r,n,f){const s=stateAt(i,r,n);assert(f(s),'Неверный промежуточный снимок '+[i,r,n]);if(n)assert.equal(cases[i].teacherRoute.runs[r].steps[n-1].expected.split('\nПоследняя запись журнала:')[0],describeLocks(s));checks++}
for(const r of [0,1]){
 check(40,r,3,s=>s.lastRead.value===29&&s.committed[201]===30);
 check(40,r,4,s=>s.lastRead.actor==='B'&&s.lastRead.value===30);
 check(40,r,6,s=>s.lastRead.value===(r?30:29));
 check(42,r,0,s=>s.transactions.A.writes[401]===24&&s.transactions.B.waiting.operation==='UPDATE');
 check(42,r,1,s=>s.committed[401]===(r?25:24)&&s.transactions.B.writes[401]===(r?24:23)&&!s.transactions.B.waiting);
 check(43,r,1,s=>s.transactions.B.waiting.key===501&&s.transactions.A.writes[501]===34);
 check(43,r,2,s=>s.committed[501]===(r?35:34)&&s.transactions.B.writes[501]===(r?34:33));
}
check(41,0,2,s=>s.transactions.B.snapshot[301]===40&&s.lastRead.value===40);
check(41,0,3,s=>s.transactions.B.waiting.operation==='FOR UPDATE');
check(41,0,4,s=>s.lastRead.value===39&&s.transactions.B.snapshot[301]===40&&s.transactions.B.locks.includes(301));
check(41,1,2,s=>s.transactions.B.writes[302]===39&&s.committed[302]===40);
check(44,0,2,s=>s.lastCycle.length===2&&!s.transactions.B.active&&s.transactions.A.writes[602]===49);
check(44,1,2,s=>s.lastCycle.length===2&&!s.transactions.A.active&&s.transactions.B.writes[601]===49);
check(46,0,1,s=>s.transactions.A.active&&s.transactions.A.locks.includes(701)&&s.transactions.B.waiting&&!s.transactions.A.running);
check(46,0,2,s=>!s.transactions.B.waiting&&s.transactions.B.writes[701]===44&&s.committed[701]===45);
check(46,1,1,s=>!s.transactions.A.connected&&s.transactions.B.writes[701]===44);
check(46,1,3,s=>s.transactions.A.connected&&!s.transactions.A.active);
check(47,0,6,s=>!s.transactions.B.active&&s.lastCycle.length===2&&s.transactions.A.writes[801]===59&&s.transactions.A.writes[802]===59);
check(47,1,6,s=>s.committed[801]===59&&s.committed[802]===59&&s.transactions.B.writes[801]===58&&!s.transactions.B.waiting);
for(const [i,runs]of Object.entries(lockRuns))for(const [r,run]of runs.entries())assert.deepEqual(stateAt(Number(i),r,run.steps.length).committed,run.committed);
fs.writeFileSync('output/teacher-lock-checkpoints.json',JSON.stringify({independentIntermediateChecks:checks,finalRoutes:14,status:'passed'},null,2)+'\n');
console.log(JSON.stringify({independentIntermediateChecks:checks,finalRoutes:14,status:'passed'}));

