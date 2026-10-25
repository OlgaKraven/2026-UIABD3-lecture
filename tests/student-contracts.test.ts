import {describe,it,expect} from 'vitest'
import {models,initialValues} from '../src/learning/workbenchModels'
import {initialLocks,command} from '../src/learning/lockModel'
import cases from '../authoring/cases.json'
import {variants,lockRuns} from '../authoring/case-scenarios.mjs'

describe('literal student case routes',()=>{
 it('accepts every alternate input named in the conditions',()=>{
  for(const [index,patches] of Object.entries(variants))for(const patch of patches){const model=models[Number(index)];for(const [key,value]of Object.entries(patch)){const field=model.fields.find(f=>f.key===key);expect(field).toBeDefined();expect(typeof value).toBe(typeof field!.value);if(field!.choices)expect(field!.choices).toContain(value)}for(const action of model.actions)expect(JSON.stringify(action.run({...initialValues(model),...patch}))).not.toMatch(/NaN|Infinity|undefined/)}
 })
 it('reaches the independently specified totals for all transaction routes',()=>{
  for(const [index,runs]of Object.entries(lockRuns))for(const run of runs){let state=initialLocks(cases[Number(index)].model);for(const [actor,op,key]of run.steps)state=command(state,actor,op,key);expect(state.committed).toEqual(run.committed);if(run.victim)expect(state.log.some(x=>x.includes(run.victim+': 1213'))).toBe(true)}
 })
 it('continues an already waiting UPDATE once without sending it again',()=>{
  const before=initialLocks(cases[42].model);expect(before.transactions.B.waiting?.operation).toBe('UPDATE');expect(before.transactions.A.writes[401]).toBe(24);const after=command(command(before,'A','COMMIT',401),'B','COMMIT',401);expect(after.committed[401]).toBe(23)
 })
 it('forms the explicit port and a separate password prompt in the CLI example',()=>{
  const model=models[20],board=model.actions[0].run({...initialValues(model),port:3316});expect(board.rows).toEqual([['mysql -h127.0.0.1 -P3316 -u reader -p','3316']])
 })
})
