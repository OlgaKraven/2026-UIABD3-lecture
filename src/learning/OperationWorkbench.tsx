import type {WorkModel,Values} from './workbenchModels'
import type {LockState} from './lockModel'
import {initialLocks} from './lockModel'
import {sourceBoard} from './workbenchModels'
import {ScenarioBoard} from './ScenarioBoard'
import {LockWorkbench} from './LockWorkbench'
export type LockConfig={mode:string;keys:number[];qty:number}
export type WorkState={values:Values;phase:number;theme:string;locks?:LockState}
type Props={model:WorkModel;state:WorkState;onChange:(s:WorkState)=>void;onUndo:()=>void;canUndo:boolean;audience:boolean;lockConfig?:LockConfig}
export function OperationWorkbench({model,state,onChange,onUndo,canUndo,audience,lockConfig}:Props){
 const changeField=(key:string,value:number|string)=>onChange({...state,values:{...state.values,[key]:value},phase:0,locks:lockConfig?initialLocks(lockConfig,Number(value)):undefined})
 const reset=()=>onChange({...state,phase:0,values:lockConfig?{qty:lockConfig.qty}:Object.fromEntries(model.fields.map(f=>[f.key,f.value])),locks:lockConfig?initialLocks(lockConfig):undefined})
 const active=model.actions[state.phase-1],next=model.actions[state.phase],fields=lockConfig?[{key:'qty',label:'Исходное количество каждой строки',value:lockConfig.qty,min:0}]:model.fields
 return <div className="operation-workbench" data-audience={audience} data-kind={lockConfig?'locks':'operations'}><section className="workbench-inputs"><h2>Исходные данные</h2><div className="workbench-fields">{fields.map(f=><label key={f.key}><span>{f.label}</span>{audience?<strong>{String(state.values[f.key])}</strong>:'choices'in f&&f.choices?<select aria-label={f.label} value={state.values[f.key]} onChange={e=>changeField(f.key,e.target.value)}>{f.choices.map(x=><option key={x}>{x}</option>)}</select>:<input aria-label={f.label} type="number" step={'step'in f?f.step||'any':'any'} min={f.min} max={'max'in f?f.max:undefined} value={state.values[f.key]} onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value))changeField(f.key,value)}}/>}</label>)}</div>{!audience&&<p className="workbench-input-help">{state.locks?'Изменение исходного количества начинает новый проход. Выбор сеанса и PK определяет следующую команду и сохраняет транзакцию.':'Значения уже заданы по условию. Сначала выполните операции с ними. Для сравнения измените один параметр и повторите проход.'}</p>}</section>
 {state.locks?<LockWorkbench state={state.locks} onChange={locks=>onChange({...state,locks})} readOnly={audience}/>:<section className="workbench-output" aria-live="polite"><h2>{active?.label||'Операции с моделью'}</h2>{active?<><ScenarioBoard board={active.run(state.values)}/><p>{active.explain}</p></>:<ScenarioBoard board={sourceBoard(model,state.values)}/>} {!audience&&next&&<button className="solve-button" onClick={()=>onChange({...state,phase:state.phase+1})}>{next.label}</button>}{!next&&state.phase>0&&<p className="workbench-complete">Сопоставьте результат с условием. Измените параметр и выполните операции снова.</p>}</section>}
 {!audience&&<div className="workbench-history"><button onClick={onUndo} disabled={!canUndo}>Отменить действие</button><button onClick={reset}>Вернуть исходные данные</button></div>}</div>
}
