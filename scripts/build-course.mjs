import fs from 'node:fs';
import {checkpoints,distractors} from '../authoring/checkpoints.mjs';
import {practice} from '../authoring/practice.mjs';
const baseline=JSON.parse(fs.readFileSync('authoring/source-baseline.json','utf8'));
const lessons=await Promise.all(Array.from({length:7},(_,i)=>import(`../authoring/lectures/${String(i+1).padStart(2,'0')}.mjs`).then(m=>m.default)));
const course={schemaVersion:1,contentVersion:'uiabd3-2026.10.25',id:'uiabd3',code:'МДК.07.01',discipline:'Управление и автоматизация баз данных',year:'2026–2027',heroTitle:'Управление и автоматизация',heroAccent:'баз данных',slogan:'Администрирование компонентов сервера баз данных',mascot:'brand/mascot/uiabd3-installation.png',mascotAlt:'Носорог подключает учебный сервер и проверяет его конфигурацию',logo:'brand/synergy-wordmark.jpg',ornament:'brand/side-ornament.png',font:'fonts/raleway-cyrillic.woff2',topicArrow:'brand/topic-arrow.webp',materialsUrl:baseline.course.materialsUrl,demo:false,semesters:[6],assessment:{mode:'autonomous',url:'assessment.json'},lectures:[]};
const notes={},cases=[],keys={},questions=[],legacy={},inputs={},boards={},visualPlan=[];
const official=['data-directory-initialization','windows-start-service','connecting','privileges-provided','charset-applications','innodb-locking','error-log'];
const stand={label:'Тестовый стенд',href:'practice/uiabd3-stand.zip'};
const save=(file,data)=>{fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n')};
const option=(text,i)=>({id:'o'+(i+1),text});
function splitCode(code){const out=[];let lines=[],n=0;for(const line of code.trimEnd().split('\n')){const cost=Math.max(1,Math.ceil(line.length/76));if(lines.length&&n+cost>7){out.push(lines.join('\n'));lines=[];n=0}lines.push(line);n+=cost}if(lines.length)out.push(lines.join('\n'));return out}
function visual(board,result){
 if(board.kind==='table')return {type:'comparison',columns:board.columns,rows:board.rows,caption:result};
 if(board.kind==='bars')return {type:'bars',items:board.rows,max:board.max,unit:board.unit,caption:result};
 if(board.kind==='graph')return {type:'network',nodes:board.nodes,edges:board.edges,caption:result};
 return {type:board.kind==='timeline'?'timeline':'process',items:board.items?board.items.map((text,i)=>({title:`Действие ${i+1}`,text})):board.rows.map(r=>({title:r.label,text:`${r.start}–${r.end} ${board.unit}: ${r.state}`})),caption:result};
}
for(const [li,topic] of baseline.topics.entries()){
 const lesson=lessons[li],id=topic.id,lecture={id,title:topic.displayTitle,sourceTitle:topic.sourceTitle,semester:6,question:topic.displayTitle,slides:[]};
 const add=(suffix,kind,title,fields={},note={})=>{
  const s={id:id+'-'+suffix,kind,kicker:topic.displayTitle,title,...fields};lecture.slides.push(s);
  const script=[s.body,...(s.bullets||[]),s.notebook,...(s.visual?.parts||[]).map(p=>p.code+'\n'+p.explanation),...(s.references||[]).map(r=>r.citation)].filter(Boolean).join('\n\n');
  notes[s.id]={script:script||title,preparation:'',questions:'',answer:'',notebook:s.notebook||'',estimatedSeconds:Math.max(20,Math.ceil(script.length/10)),...note};return s;
 };
 add('title','title',topic.displayTitle,{body:course.discipline},{script:`${lesson.context}\n\nНачните с конкретного случая: ${lesson.units[0].input} Спросите, что здесь уже известно, а что требует проверки. Не требуйте знания ещё не введённых команд.`});
 const old=baseline.decks[li].slides;
 for(const [group,number,label] of [['primary',2,'Основная литература'],['additional',3,'Дополнительная литература']]){
  const s=old[number];const refs=s.bullets.map((citation,i)=>({citation,url:s.links[i].url}));if(group==='additional')refs.push({citation:'Документация MySQL: '+topic.displayTitle,url:`https://dev.mysql.com/doc/refman/8.4/en/${official[li]}.html`});
  add('literature-'+group,'literature',label,{kicker:'Литература',readingGroup:group,references:refs});
 }
 add('materials','materials','Материалы к занятию',{}, {script:'Материалы открываются по QR-коду или обычной ссылке. Для выполнения команд используется отдельный учебный стенд, ссылка на комплект приведена рядом с практикой.'});
 add('context','theory','Исходная ситуация',{body:lesson.context});
 add('prerequisites','theory','Опора для разбора',{body:lesson.prerequisites});
 add('agenda','agenda','Вопросы лекции',{},{script:topic.questions.map((q,i)=>li===0&&i===6?'Экземпляр и база':q.title).join('\n')});
 for(const [qi,u] of lesson.units.entries()){
  const qid=`q${String(qi+1).padStart(2,'0')}`,title=li===0&&qi===6?'Экземпляр и база':topic.questions[qi].title,kicker=`Вопрос ${qi+1}`,start=lecture.slides.length;
  add(qid+'-section','section',title,{kicker});
  add(qid+'-concept','theory',title,{kicker,body:u.paragraphs[0]},{script:u.definition+'\n\n'+u.paragraphs[0],questions:u.test.prompt,answer:u.test.explanation});
  add(qid+'-explanation','theory',title,{kicker,body:u.paragraphs[1]},{script:u.paragraphs[1]+'\n\n'+u.input,questions:'Что изменится в следующем случае: '+u.changed,answer:u.changedResult});
  const logic=add(qid+'-logic','process',title,{kicker,visual:visual(u.board,u.result),supplement:{label:'Развернуть схему',href:`?mode=diagram&lecture=${id}&slide=${id}-${qid}-logic`}},{script:u.input+'\n\n'+u.result,preparation:'Сначала покажите обзор, затем вручную выделяйте строки, связи или действия. Исходные данные обозначены на схеме; автоматический запуск не нужен.',questions:'Как из указанных исходных данных получается этот результат?',answer:u.result});
  inputs[logic.id]={body:u.input,steps:[{title:'Вывод',text:u.result}]};boards[logic.id]=u.board;
  visualPlan.push({slideId:logic.id,purpose:title,kind:u.board.kind,catalogGroup:u.board.kind==='graph'?'Связи и структура':u.board.kind==='table'?'Таблицы и матрицы':u.board.kind==='bars'?'Сравнение величин':u.board.kind==='timeline'?'Время и длительность':'Порядок действий',shows:u.result});
  add(qid+'-changed','example','Если условие изменилось',{kicker,body:u.changed},{script:u.changed+'\n\n'+u.changedResult,questions:'Какое исходное условие больше не действует?',answer:u.changedResult});
  add(qid+'-changed-result','theory','Разбор изменённого случая',{kicker,body:u.changedResult});
  add(qid+'-notebook','notebook','Запишите',{kicker,notebook:u.definition},{script:u.definition+'\n\n'+u.result,questions:u.test.prompt,answer:u.test.explanation});
  for(const [pi,p] of practice[li].entries())if(p.q===qi){
   const suffix=`${qid}-practice-${pi+1}`;
   add(suffix,'theory',p.title,{kicker:kicker+' · практика',body:p.text,supplement:stand},{script:p.text,preparation:'Учебный экземпляр по ссылке на слайде. Команды ОС выполняются в PowerShell, SQL — внутри mysql; среды не смешивают.',answer:p.expected});
   let code=p.code;
   if(p.file){code=fs.readFileSync('public/practice/'+p.file,'utf8');add(suffix+'-file','theory','Запуск учебного файла',{kicker:kicker+' · практика',body:`В комплекте стенда: sql/${p.file}. В указанном сеансе mysql выполните SOURCE sql/${p.file};. Код далее образует один файл; перед выполнением подтвердите базу и учётную запись.`,supplement:{label:'Скачать '+p.file,href:'practice/'+p.file}})}
   if(code)for(const [ci,part] of splitCode(code).entries())add(suffix+'-code-'+(ci+1),'example',`Команды практики${splitCode(code).length>1?' · '+(ci+1):''}`,{kicker:kicker+' · практика',visual:{type:'codeParts',parts:[{label:p.file?'SQL · MySQL':'Команды указанной среды',code:part,explanation:p.file?'Выполняйте файл целиком.':'Порядок и среда выполнения заданы условием.'}],caption:'Следующий слайд показывает ожидаемый результат проверки.'}},{answer:p.expected});
   add(suffix+'-check','example','Ожидаемый результат',{kicker:kicker+' · практика',body:p.expected});
  }
  const cid=id+'-'+qid;
  add(qid+'-case','theory',title,{kicker,visual:{type:'comparison',columns:['Описание задачи','Что делаем'],rows:[[u.case.context,u.case.operation]],caption:'Обсудите первое действие, затем выполните операции с моделью.'},supplement:{label:'Решить задачу',href:'?mode=case&case='+cid}},{script:u.case.context+'\n\n'+u.case.operation,preparation:'Кнопка открывает рабочую схему в модальном окне. Выполните операции, поменяйте исходные параметры, сравните результат и отмените действие. Штатный режим показа синхронизирует окно аудитории.',questions:'Какое действие предложит группа и почему?',answer:u.case.solution});
  cases.push({id:cid,lectureId:id,semester:6,title,returnSlide:cid+'-case',context:u.case.context,operation:u.case.operation,solution:u.case.solution,model:u.case.model});
  const extra=checkpoints[li][qi];
  const tasks=[
   {type:'single',prompt:u.test.prompt,options:[...u.test.options,distractors[li][qi]].map(option)},
   {type:'multiple',choose:2,prompt:'Выберите два утверждения, соответствующих разобранному механизму.',options:[extra[2]+' — '+extra[3],extra[2]+' — '+extra[5],extra[4]+' — '+extra[5],extra[4]+' — '+extra[3],`Неверно, что ${extra[2]} — ${extra[3]}`].map(option)},
   {type:'short',prompt:extra[0]+' Введите короткий ответ или команду без скобок.'},
   {type:'matching',prompt:'Соотнесите понятия и их роль в разобранном примере.',items:[{id:'i1',text:extra[2]},{id:'i2',text:extra[4]},{id:'i3',text:'Исходное условие примера'},{id:'i4',text:'Изменённое условие'}],options:[{id:'o2',text:extra[5]},{id:'o4',text:u.changed},{id:'o1',text:extra[3]},{id:'o3',text:u.input}]}
  ];
  const answers=[{correct:['o'+(u.test.correct+1)],explanation:u.test.explanation},{correct:['o1','o3'],explanation:extra[2]+' — '+extra[3]+'. '+extra[4]+' — '+extra[5]+'.'},{accepted:[extra[1],...(extra[1]==='CONNECTION_ID'?['CONNECTION_ID()']:extra[1]==='DATABASE'?['DATABASE()']:extra[1]==='CURRENT_USER'?['CURRENT_USER()']:extra[1]==='VERSION'?['VERSION()']:[])],explanation:extra[0]+' Ответ: '+extra[1]+'.'},{pairs:{i1:'o1',i2:'o2',i3:'o3',i4:'o4'},explanation:extra[2]+' — '+extra[3]+'. '+extra[4]+' — '+extra[5]+'.'}];
  for(const [ti,t] of tasks.entries()){t.id=cid+'-T0'+(ti+1);keys[t.id]={type:t.type,...answers[ti]};add(qid+'-T0'+(ti+1)+'-slide','test',`Самопроверка ${ti+1} из 4`,{kicker,task:t},{script:t.prompt,questions:t.prompt,answer:answers[ti].explanation})}
  questions.push({questionId:cid,lectureId:id,title,slideIds:lecture.slides.slice(start).map(s=>s.id),evidenceSlideIds:[logic.id,cid+'-case']});
 }
 add('summary','summary','Связь со следующей темой',{body:lesson.bridge});
 add('questions','questions','Вопросы по разбору',{bullets:[lesson.units[0].test.prompt,lesson.units[4].test.prompt,lesson.units[7].test.prompt]},{answer:[lesson.units[0].test.explanation,lesson.units[4].test.explanation,lesson.units[7].test.explanation].join('\n')});
 course.lectures.push(lecture);
 legacy[id]={};for(const s of old){const qn=s.questionNumber||s.question||(s.kicker?.match(/Вопрос (\d+)/i)?.[1]?Number(s.kicker.match(/Вопрос (\d+)/i)[1]):NaN);let target=id+'-context';if(s.number===1)target=id+'-title';else if(s.number===3)target=id+'-literature-primary';else if(s.number===4)target=id+'-literature-additional';else if(s.number===5)target=id+'-materials';else if(Number.isInteger(qn)&&qn>=1&&qn<=8){const prefix=id+'-q'+String(qn).padStart(2,'0');target=prefix+(s.kind==='notebook'?'-notebook':s.kind==='test'?'-T01-slide':s.kind==='practice'?'-case':s.kind==='process'||s.kind==='comparison'?'-logic':'-concept')}else if(s.kind==='test')target=id+'-q08-T01-slide';else if(s.kind==='summary')target=id+'-summary';legacy[id][s.number]=target}
}
save('public/course.json',course);save('public/teacher-notes.json',{schemaVersion:1,courseId:course.id,contentVersion:course.contentVersion,notes});save('public/assessment.json',{schemaVersion:1,courseId:course.id,contentVersion:course.contentVersion,mode:'autonomous-educational',keys});save('public/legacy-links.json',legacy);save('authoring/cases.json',cases);save('authoring/questions.json',questions);save('authoring/visual-plan.json',visualPlan);save('src/learning/visual-inputs.json',inputs);save('src/learning/explanation-boards.json',boards);
fs.writeFileSync('README.md','# 6 семестр\n\n'+course.lectures.map(l=>`- [${l.title}](https://olgakraven.github.io/2026-UIABD3-lecture/?lecture=${l.id})`).join('\n')+'\n');
console.log(JSON.stringify({lectures:7,questions:questions.length,cases:cases.length,tasks:Object.keys(keys).length,slides:course.lectures.reduce((n,l)=>n+l.slides.length,0)}));
