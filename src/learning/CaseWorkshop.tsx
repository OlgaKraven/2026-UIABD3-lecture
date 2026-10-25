import {ProjectionChoiceScope} from './projectionChoiceScope'
import {useEffect,useRef,useState} from 'react'
import cases from '../../authoring/cases.json'
import {models,initialValues} from './workbenchModels'
import {initialLocks} from './lockModel'
import {OperationWorkbench} from './OperationWorkbench'
import type {WorkState,LockConfig} from './OperationWorkbench'
import './workbench.css'
type Props={base:string;id:string;onClose?:()=>void;readOnly?:boolean;sessionId?:string}
export function CaseWorkshop({base,id,onClose,readOnly,sessionId}:Props){const index=cases.findIndex(c=>c.id===id);return index>=0?<Workshop key={id} base={base} index={index} onClose={onClose} readOnly={readOnly} sessionId={sessionId}/>:<main><h1>Задача не найдена</h1><a href={base}>К лекциям</a></main>}
function Workshop({base,index,onClose,readOnly,sessionId}:Omit<Props,'id'>&{index:number}){
 const item=cases[index],model=models[index],config=item.model.type==='locks'?item.model as unknown as LockConfig:undefined,audience=readOnly===true
 const [session]=useState(()=>sessionId||new URLSearchParams(location.search).get('session')||crypto.randomUUID())
 const [state,setState]=useState<WorkState>(()=>({values:config?{qty:config.qty}:initialValues(model),phase:0,theme:document.documentElement.dataset.theme||'light',locks:config?initialLocks(config):undefined}))
 const [canUndo,setCanUndo]=useState(false),stack=useRef<WorkState[]>([]),bus=useRef<BroadcastChannel|null>(null),latest=useRef({...state,sequence:0})
 const change=(next:WorkState)=>{stack.current.push(structuredClone(state));if(stack.current.length>200)stack.current.shift();setCanUndo(true);setState(next)}
 const undo=()=>{const previous=stack.current.pop();if(previous)setState(previous);setCanUndo(stack.current.length>0)}
 useEffect(()=>{const key=`uiabd3:workbench:${session}:${item.id}`,channel=new BroadcastChannel(key);bus.current=channel;const receive=(value:unknown)=>{const v=value as typeof latest.current;if(!v||!Number.isFinite(v.sequence)||v.sequence<=latest.current.sequence||!Number.isInteger(v.phase)||v.phase<0||v.phase>model.actions.length||!v.values)return;if(config&&(!v.locks?.transactions?.A||!v.locks?.transactions?.B))return;latest.current=v;setState({values:v.values,phase:v.phase,theme:v.theme==='dark'?'dark':'light',locks:v.locks})};channel.onmessage=e=>{if(audience)receive(e.data);else if(e.data?.request)channel.postMessage(latest.current)};if(audience){try{receive(JSON.parse(localStorage.getItem(key)||'null'))}catch{/* No public snapshot. */}channel.postMessage({request:true})}return()=>{channel.close();bus.current=null}},[audience,session,item.id,model,config])
 useEffect(()=>{document.documentElement.dataset.theme=state.theme;if(audience)return;const value={...state,sequence:Math.max(Date.now(),latest.current.sequence+1)};latest.current=value;bus.current?.postMessage(value);try{localStorage.setItem(`uiabd3:workbench:${session}:${item.id}`,JSON.stringify(value))}catch{/* Live channel remains available. */}},[state,audience,session,item.id])
 useEffect(()=>{const previous=document.title;document.title=item.title+' · Рабочая схема';return()=>{document.title=previous}},[item.title])
 const back=`${base}?lecture=${item.lectureId}&slide=${item.returnSlide}`
 const theme=()=>{const next=state.theme==='dark'?'light':'dark';setState({...state,theme:next});try{localStorage.setItem(`lecture:${base}:uiabd3:theme`,JSON.stringify(next))}catch{/* Visible theme remains available. */}window.dispatchEvent(new Event('course-theme'))}
 return <main className="case-workshop case-demo"><header>{!onClose&&<a href={back}>← К условию на слайде</a>}<span>6 семестр</span>{!audience&&<button onClick={theme}>{state.theme==='dark'?'Светлая тема':'Тёмная тема'}</button>}</header><h1>{item.title}</h1><ProjectionChoiceScope value={item.id}><OperationWorkbench model={model} state={state} onChange={change} onUndo={undo} canUndo={canUndo} audience={audience} lockConfig={config}/></ProjectionChoiceScope>{!onClose&&<footer><a href={back}>К условию на слайде →</a></footer>}</main>
}
