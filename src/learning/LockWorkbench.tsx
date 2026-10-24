import {useState} from 'react'
import {ScenarioBoard} from './ScenarioBoard'
import {table} from './workbenchModels'
import {actors,command,waitEdges} from './lockModel'
import type {Actor,Command,LockState} from './lockModel'
export function LockWorkbench({state,onChange,readOnly}:{state:LockState;onChange:(s:LockState)=>void;readOnly:boolean}){
 const keys=Object.keys(state.committed).map(Number),[actor,setActor]=useState<Actor>('A'),[key,setKey]=useState(keys[0])
 const commands:Command[]=['BEGIN','SELECT','FOR UPDATE','UPDATE','COMMIT','ROLLBACK','SLEEP','KILL QUERY','KILL CONNECTION','RECONNECT']
 const edges=waitEdges(state)
 return <section className="workbench-live lock-workbench"><h2>Два сеанса и общие строки</h2><p className="workbench-input-help">Учебная модель InnoDB: точный поиск по PK, явные транзакции, REPEATABLE READ. UPDATE вычитает 1. Взаимный цикл автоматически разрешается откатом запрашивающего сеанса; настоящий InnoDB может выбрать другую жертву.</p>
 <ScenarioBoard board={table(['PK','Зафиксировано','A · собственное','B · собственное','Владелец блокировки'],keys.map(k=>[k,state.committed[k],state.transactions.A.writes[k]??'—',state.transactions.B.writes[k]??'—',actors.find(a=>state.transactions[a].locks.includes(k))||'свободна']))}/>
 <ScenarioBoard board={{kind:'graph',nodes:actors.map(a=>({id:a,title:`Сеанс ${a}`,text:!state.transactions[a].connected?'отключён':state.transactions[a].waiting?'ожидает PK '+state.transactions[a].waiting!.key:state.transactions[a].running?'выполняет SLEEP':state.transactions[a].active?'транзакция открыта':'вне транзакции'})),edges}}/>
 <p className="visual-caption">Стрелка «ожидающий → владелец» обозначает зависимость, а не передачу данных. {edges.length?'Выбранный ресурс удерживается до завершения транзакции.':'В текущем состоянии ожиданий строк нет.'}</p>
 {state.lastCycle.length>0&&<div className="lock-cycle"><strong>Обнаруженный цикл до отката</strong>{state.lastCycle.map(x=><p key={x}><code>{x}</code></p>)}</div>}
 {state.lastRead&&<p role="status"><code>{state.lastRead.actor}: {state.lastRead.kind}, PK {state.lastRead.key} → {state.lastRead.value}</code></p>}
 {!readOnly&&<><div className="workbench-fields lock-select"><label>Сеанс<select aria-label="Сеанс" value={actor} onChange={e=>setActor(e.target.value as Actor)}>{actors.map(a=><option key={a}>{a}</option>)}</select></label><label>PK<select aria-label="PK" value={key} onChange={e=>setKey(Number(e.target.value))}>{keys.map(k=><option key={k}>{k}</option>)}</select></label></div><div className="workbench-actions">{commands.map(op=><button key={op} onClick={()=>onChange(command(state,actor,op,key))}>{op}</button>)}</div></>}
 <details open={!readOnly}><summary>Журнал операций</summary><ol className="lock-log">{state.log.map((x,i)=><li key={i}><code>{x}</code></li>)}</ol></details></section>
}
