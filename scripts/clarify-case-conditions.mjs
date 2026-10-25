import fs from 'node:fs';
import {models,initialValues} from '../src/learning/workbenchModels.ts';
import {initialLocks,command} from '../src/learning/lockModel.ts';
import {briefs} from '../authoring/case-briefs.mjs';
import {variants,lockRuns} from '../authoring/case-scenarios.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const course=read('public/course.json'),pack=read('public/teacher-notes.json'),cases=read('authoring/cases.json'),questions=read('authoring/questions.json');
if(briefs.length!==cases.length)throw Error('Неполный набор студенческих условий');
for(const lecture of course.lectures)lecture.slides=lecture.slides.filter(s=>!s.id.includes('-case-input-'));
for(const [i,item] of cases.entries()){
 const [context,task,result]=briefs[i];item.context=context;item.operation=task;
 const lecture=course.lectures.find(l=>l.id===item.lectureId),passport=lecture.slides.find(s=>s.id===item.returnSlide),model=models[i];let fields=model.fields.map(f=>[f.label,String(f.value)]);
 if(item.model.type==='locks'){
  const config=item.model,s=initialLocks(config);
  fields=[...config.keys.map(key=>['PK '+key+' · зафиксированное количество',String(config.qty)]),...['A','B'].map(a=>{const t=s.transactions[a];return ['Исходное состояние '+a,!t.active?'вне транзакции':(t.waiting?'ожидает '+t.waiting.operation+' PK '+t.waiting.key:t.running?'выполняет SLEEP':'транзакция открыта')+'; удерживает '+(t.locks.join(', ')||'нет')]}),...['A','B'].map(a=>['Незафиксированные изменения '+a,Object.entries(s.transactions[a].writes).map(([k,v])=>'PK '+k+' → '+v).join('; ')||'нет']),['Действие UPDATE','Вычесть 1 из выбранной строки'],['Обычный SELECT','REPEATABLE READ; без запроса блокировки']];
 }
 const inputs=[];
 for(let n=0;n<fields.length;n+=4){
  const id=item.id+'-case-input-'+(n/4+1),slide={id,kind:'example',kicker:passport.kicker,title:item.title,visual:{type:'comparison',columns:['Параметр рабочей схемы','Начальное значение'],rows:fields.slice(n,n+4),caption:'Это уже заполненный исходный набор схемы. Сначала выполните операции с ним; изменение параметра начинает новый проход.'}};
  inputs.push(slide);pack.notes[id]={script:item.context+'\n\n'+fields.slice(n,n+4).map(r=>r.join(': ')).join('\n'),preparation:'Разберите смысл начальных значений перед запуском модели.',questions:'Что здесь дано, а что предстоит получить действием?',answer:item.solution.split('\n\nИсходный проход:\n')[0],notebook:'',estimatedSeconds:45};
 }
 passport.visual={type:'comparison',columns:['Дано','Что сделать'],rows:[[context,task]],caption:'Результат: '+result};
 const observed=item.model.type==='locks'?'Используйте собственные и зафиксированные значения из исходного снимка; повторные проходы начинаются кнопкой «Вернуть исходные данные».':model.actions.map(a=>a.label+': '+a.run(initialValues(model)).rows?.map(r=>r.join(' | ')).join('; ')).join('\n');
 const repeats=(variants[i]||[]).map((patch,n)=>{for(const [key,value] of Object.entries(patch)){const field=model.fields.find(f=>f.key===key);if(!field||field.choices&&!field.choices.includes(value))throw Error(item.id+': недопустимый сценарий '+key)}const values={...initialValues(model),...patch};return 'Сравнение '+(n+1)+' ('+Object.entries(patch).map(([k,v])=>model.fields.find(f=>f.key===k).label+'='+v).join('; ')+'):\n'+model.actions.map(a=>a.label+': '+a.run(values).rows?.map(r=>r.join(' | ')).join('; ')).join('\n')});
 for(const run of lockRuns[i]||[]){let state=initialLocks(item.model);for(const [actor,op,key] of run.steps)state=command(state,actor,op,key);if(JSON.stringify(state.committed)!==JSON.stringify(run.committed))throw Error(item.id+': итог команд не совпал с условием');repeats.push(run.name+': '+run.steps.map(([a,op,k])=>a+' '+op+' PK '+k).join(' → ')+'\nИтог: '+Object.entries(run.committed).map(([k,v])=>'PK '+k+'='+v).join('; ')+(run.victim?'; учебная жертва '+run.victim:'.'))}
 item.solution=item.solution.split('\n\nИсходный проход:\n')[0]+'\n\nИсходный проход:\n'+observed+'\n\n'+repeats.join('\n\n');
 pack.notes[passport.id]={...pack.notes[passport.id],script:context+'\n\n'+task+'\n\nПредъявляемый результат: '+result,preparation:'Сначала прочитайте исходный снимок и условие на слайдах. Это учебная модель; её кнопки не выполняют команды на сервере. Выполняйте только последовательности, названные в условии; при сравнении вариантов возвращайте заданные исходные данные.',questions:result,answer:item.solution};
 lecture.slides.splice(lecture.slides.indexOf(passport),0,...inputs);
 item.condition={context,task,result,inputSlides:inputs.map(s=>s.id),initialValues:item.model.type==='locks'?{qty:item.model.qty}:initialValues(model),variants:variants[i]||[],lockRuns:lockRuns[i]||[]};
 const q=questions.find(q=>q.questionId===item.id);q.slideIds=q.slideIds.filter(id=>!id.includes('-case-input-'));q.slideIds.splice(q.slideIds.indexOf(passport.id),0,...inputs.map(s=>s.id));q.evidenceSlideIds=[...new Set([...q.evidenceSlideIds,...inputs.map(s=>s.id)])];
}
save('public/course.json',course);save('public/teacher-notes.json',pack);save('authoring/cases.json',cases);save('authoring/questions.json',questions);
console.log(JSON.stringify({conditions:cases.length,initialDataSlides:cases.reduce((n,c)=>n+c.condition.inputSlides.length,0)}));
