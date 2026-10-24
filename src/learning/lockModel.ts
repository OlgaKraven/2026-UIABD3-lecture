export type Actor='A'|'B'
type Wait={key:number;operation:'UPDATE'|'FOR UPDATE'}
export type Transaction={connected:boolean;active:boolean;writes:Record<number,number>;locks:number[];waiting:Wait|null;snapshot:Record<number,number>|null;running:boolean}
export type LockState={committed:Record<number,number>;transactions:Record<Actor,Transaction>;log:string[];lastCycle:string[];lastRead:{actor:Actor;key:number;value:number;kind:string}|null}
export type Command='BEGIN'|'SELECT'|'FOR UPDATE'|'UPDATE'|'COMMIT'|'ROLLBACK'|'SLEEP'|'KILL QUERY'|'KILL CONNECTION'|'RECONNECT'
export const actors:Actor[]=['A','B']
const empty=():Transaction=>({connected:true,active:false,writes:{},locks:[],waiting:null,snapshot:null,running:false})
const owner=(s:LockState,key:number)=>actors.find(a=>s.transactions[a].locks.includes(key))
const append=(s:LockState,text:string)=>{s.log.push(text);if(s.log.length>30)s.log.shift()}
export const waitEdges=(s:LockState)=>actors.flatMap(a=>{const w=s.transactions[a].waiting,b=w&&owner(s,w.key);return b&&b!==a?[{from:a,to:b,label:'PK '+w!.key}]:[]})
function applyWrite(s:LockState,a:Actor,w:Wait){const t=s.transactions[a];if(!t.locks.includes(w.key))t.locks.push(w.key);if(w.operation==='UPDATE')t.writes[w.key]=(t.writes[w.key]??s.committed[w.key])-1;else s.lastRead={actor:a,key:w.key,value:t.writes[w.key]??s.committed[w.key],kind:'FOR UPDATE'};t.waiting=null}
function wake(s:LockState){for(const a of actors){const w=s.transactions[a].waiting;if(w&&!owner(s,w.key)){applyWrite(s,a,w);append(s,`${a}: ожидание завершено, ${w.operation} PK ${w.key} выполнен`)}}}
function finish(s:LockState,a:Actor,commit:boolean){const t=s.transactions[a];if(commit)Object.assign(s.committed,t.writes);Object.assign(t,{active:false,writes:{},locks:[],waiting:null,snapshot:null,running:false});wake(s)}
export function command(previous:LockState,a:Actor,op:Command,key:number):LockState{
 const s=structuredClone(previous),t=s.transactions[a];s.lastCycle=[]
 if(op==='RECONNECT'){if(!t.connected){s.transactions[a]=empty();append(s,`${a}: новое соединение`)}else append(s,`${a}: соединение уже открыто`);return s}
 if(!t.connected){append(s,`${a}: нет соединения, требуется переподключение`);return s}
 if(op==='KILL CONNECTION'){finish(s,a,false);s.transactions[a].connected=false;append(s,`Администратор: KILL CONNECTION ${a}; незавершённое откачено`);return s}
 if(op==='KILL QUERY'){t.waiting=null;t.running=false;append(s,`Администратор: KILL QUERY ${a}; прежняя транзакция и её блокировки сохранены`);return s}
 if(t.waiting||t.running){append(s,`${a}: текущая команда ещё выполняется; завершите её или вмешайтесь из администратора`);return s}
 if(op==='BEGIN'){if(t.active)append(s,`${a}: транзакция уже открыта; модель требует сначала завершить её`);else {t.active=true;append(s,`${a}: START TRANSACTION`)};return s}
 if(op==='COMMIT'||op==='ROLLBACK'){finish(s,a,op==='COMMIT');append(s,`${a}: ${op}; ресурсы освобождены`);return s}
 if(op==='SLEEP'){t.running=true;append(s,`${a}: выполняется длительный SELECT SLEEP`);return s}
 if(op==='SELECT'){if(t.active&&!t.snapshot)t.snapshot={...s.committed};const value=t.writes[key]??(t.active?t.snapshot![key]:s.committed[key]);s.lastRead={actor:a,key,value,kind:'consistent SELECT'};append(s,`${a}: SELECT PK ${key} → ${value}, без запроса блокировки`);return s}
 if(!t.active){append(s,`${a}: для удержания блокировки в этой модели сначала выполните BEGIN`);return s}
 const b=owner(s,key),request={key,operation:op as Wait['operation']}
 if(b&&b!==a){t.waiting=request;append(s,`${a}: ${op} PK ${key} ожидает ${b}`);const reverse=s.transactions[b].waiting;if(reverse&&owner(s,reverse.key)===a){s.lastCycle=[`${a} → ${b}: PK ${key}`,`${b} → ${a}: PK ${reverse.key}`];append(s,`Цикл ${a} → ${b} → ${a}; учебная модель выбирает жертвой запрашивающего ${a}`);finish(s,a,false);append(s,`${a}: 1213, вся транзакция откачена`)}return s}
 applyWrite(s,a,request);append(s,`${a}: ${op} PK ${key} выполнен; блокировка до конца транзакции`);return s
}
export function initialLocks(config:{mode:string;keys:number[];qty:number},qty=config.qty):LockState{
 let s:LockState={committed:Object.fromEntries(config.keys.map(k=>[k,qty])),transactions:{A:empty(),B:empty()},log:[],lastCycle:[],lastRead:null}
 const run=(a:Actor,op:Command,k=config.keys[0])=>{s=command(s,a,op,k)}
 if(['rowLock','wait','long','kill','deadlock'].includes(config.mode)){run('A','BEGIN');run('A','UPDATE')}
 if(['wait','long','kill','deadlock'].includes(config.mode))run('B','BEGIN')
 if(config.mode==='deadlock')run('B','UPDATE',config.keys[1])
 if(config.mode==='kill')run('A','SLEEP')
 if(['wait','kill'].includes(config.mode))run('B','UPDATE')
 return s
}
