import fs from 'node:fs';
import {models,initialValues} from '../src/learning/workbenchModels.ts';
import {initialLocks} from '../src/learning/lockModel.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const course=read('public/course.json'),pack=read('public/teacher-notes.json'),cases=read('authoring/cases.json'),questions=read('authoring/questions.json');
for(const [i,item] of cases.entries()){
 const lecture=course.lectures.find(l=>l.id===item.lectureId),passport=lecture.slides.find(s=>s.id===item.returnSlide),model=models[i];let fields=model.fields.map(f=>[f.label,String(f.value)]);
 if(item.model.type==='locks'){
  const config=item.model,s=initialLocks(config);
  fields=[...config.keys.map(key=>['PK '+key+' · зафиксированное количество',String(config.qty)]),...['A','B'].map(a=>{const t=s.transactions[a];return ['Исходное состояние '+a,!t.active?'вне транзакции':(t.waiting?'ожидает PK '+t.waiting.key:t.running?'выполняет SLEEP':'транзакция открыта')+'; удерживает '+(t.locks.join(', ')||'нет')]}),['Действие UPDATE','Вычесть 1 из выбранной строки'],['Обычный SELECT','REPEATABLE READ; без запроса блокировки']];
 }
 const inputs=[];
 for(let n=0;n<fields.length;n+=4){
  const id=item.id+'-case-input-'+(n/4+1),slide={id,kind:'example',kicker:passport.kicker,title:item.title,visual:{type:'comparison',columns:['Параметр рабочей схемы','Начальное значение'],rows:fields.slice(n,n+4),caption:'Это уже заполненный исходный набор схемы. Сначала выполните операции с ним; изменение параметра начинает новый проход.'}};
  inputs.push(slide);pack.notes[id]={script:item.context+'\n\n'+fields.slice(n,n+4).map(r=>r.join(': ')).join('\n'),preparation:'Разберите смысл начальных значений перед запуском модели.',questions:'Что здесь дано, а что предстоит получить действием?',answer:item.solution,notebook:'',estimatedSeconds:45};
 }
 passport.visual.caption=item.model.type==='locks'?'Все количества и состояния сеансов заданы на предыдущих слайдах. Выберите сеанс, PK и нужную команду; проследите изменение таблицы и графа.':`Значения уже заданы. Сначала выполните «${model.actions[0].label}», затем следующую операцию. Для сравнения измените один параметр и повторите.`;
 lecture.slides.splice(lecture.slides.indexOf(passport),0,...inputs);
 item.condition={context:item.context,task:item.operation,inputSlides:inputs.map(s=>s.id),initialValues:item.model.type==='locks'?{qty:item.model.qty}:initialValues(model)};
 const q=questions.find(q=>q.questionId===item.id);q.slideIds.splice(q.slideIds.indexOf(passport.id),0,...inputs.map(s=>s.id));q.evidenceSlideIds.push(...inputs.map(s=>s.id));
}
save('public/course.json',course);save('public/teacher-notes.json',pack);save('authoring/cases.json',cases);save('authoring/questions.json',questions);
console.log(JSON.stringify({conditions:cases.length,initialDataSlides:cases.reduce((n,c)=>n+c.condition.inputSlides.length,0)}));
