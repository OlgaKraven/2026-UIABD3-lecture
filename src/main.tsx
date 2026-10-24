import {createRoot} from 'react-dom/client'
import {LectureSite,validateCourse,VisualRendererProvider} from '@olgakraven/lecture-engine'
import '@olgakraven/lecture-engine/style.css'
import {LectureTools} from './learning/LectureTools'
import {CourseCatalog} from './CourseCatalog'
import {prepareTeacherSession} from './teacherNotes'
import {LearningVisual} from './learning/LearningVisual'
import {ContentVisual} from './learning/ContentVisual'
import {installPresentation} from './presentation'
import './presentation-design.css'
import './learning/learning.css'
const root=createRoot(document.getElementById('root')!)
async function load(){
 root.render(<p role="status">Загружаем курс…</p>)
 try{
  const base=import.meta.env.BASE_URL,response=await fetch(base+'course.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)})
  if(!response.ok)throw Error('Не удалось загрузить лекции')
  const course=await response.json();validateCourse(course)
  const url=new URL(location.href),legacy=await fetch(base+'legacy-links.json').then(r=>r.json()),topic=url.searchParams.get('topic')
  if(topic&&!url.searchParams.has('lecture')){url.searchParams.delete('topic');url.searchParams.set('lecture',topic);url.searchParams.set('slide',legacy[topic]?.[url.searchParams.get('slide')||'1']||'')}
  if(url.pathname.replace(/\/$/,'').endsWith('/print')){url.pathname=base;url.searchParams.set('mode','print');url.searchParams.set('scope',url.searchParams.get('lecture')||'all')}
  history.replaceState(null,'',url)
  const prefix=`lecture:${base}:${course.id}`
  try{
   if(!localStorage.getItem(prefix+':theme'))localStorage.setItem(prefix+':theme',JSON.stringify(localStorage.getItem('uiabd3.theme')==='dark'?'dark':'light'))
   if(!localStorage.getItem(prefix+':profile')){const p=JSON.parse(localStorage.getItem('uiabd3.teacherProfile')||'null');if(p&&typeof p.fullName==='string')localStorage.setItem(prefix+':profile',JSON.stringify({fullName:p.fullName,position:p.position||'',department:p.organizationUnit||''}))}
   for(const l of course.lectures){const key=`${prefix}:${course.contentVersion}:${l.id}:progress`,old=localStorage.getItem('uiabd3.progress.'+l.id);if(!localStorage.getItem(key)&&old&&legacy[l.id]?.[old])localStorage.setItem(key,JSON.stringify(legacy[l.id][old]))}
   document.documentElement.dataset.theme=JSON.parse(localStorage.getItem(prefix+':theme')||'"light"')
  }catch{/* Keep original data intact if storage is unavailable or malformed. */}
  document.title=`${course.code} · 3 курс`
  const mode=url.searchParams.get('mode')
  if(mode==='case'){const {CaseWorkshop}=await import('./learning/CaseWorkshop');root.render(<CaseWorkshop base={base} id={url.searchParams.get('case')||''}/>);return}
  if(mode==='diagram'){const {DiagramView}=await import('./learning/DiagramView');root.render(<DiagramView course={course} base={base} id={url.searchParams.get('slide')||''}/>);return}
  let session:Awaited<ReturnType<typeof prepareTeacherSession>>|undefined
  if(mode!=='audience'&&mode!=='print'){const r=await fetch(base+'teacher-notes.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Не удалось загрузить сценарий преподавателя');session=await prepareTeacherSession(course,base,await r.json(),{getItem:k=>localStorage.getItem(k)})}
  installPresentation(course,base)
  root.render(<VisualRendererProvider render={props=>props.slide.id.endsWith('-logic')?<LearningVisual key={props.slide.id} {...props}/>:props.slide.visual||props.slide.steps?<ContentVisual slide={props.slide}/>:undefined}><LectureTools course={course} base={base}><LectureSite course={course} base={base} teacherNotes={session?.notes} resolveTeacherNotes={session?.resolve} renderCatalog={props=><CourseCatalog {...props}/>}/></LectureTools></VisualRendererProvider>)
 }catch(error){root.render(<main><h1>Курс не загрузился</h1><p role="alert">{String(error)}</p><button onClick={()=>void load()}>Повторить</button></main>)}
}
void load()
