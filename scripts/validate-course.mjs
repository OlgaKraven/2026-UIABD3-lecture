import fs from 'node:fs';
import {validateCourse,validateBank,validateTeacherPack,courseAssets} from '@olgakraven/lecture-validation';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),course=read('public/course.json'),bank=read('public/assessment.json'),pack=read('public/teacher-notes.json'),cases=read('authoring/cases.json'),legacy=read('public/legacy-links.json'),baseline=read('authoring/source-baseline.json');
validateCourse(course);validateBank(bank,course);validateTeacherPack(pack,course);
const ids=new Set(course.lectures.flatMap(l=>l.slides.map(s=>s.id)));
if(course.id!=='uiabd3'||course.lectures.length!==7||course.semesters.join()!=='6')throw Error('Границы курса');
for(const lecture of course.lectures){
 if(lecture.slides[0].kind!=='title'||lecture.slides.at(-1).kind!=='questions')throw Error('Границы лекции');
 for(const item of cases.filter(c=>c.lectureId===lecture.id)){
  const index=lecture.slides.findIndex(s=>s.id===item.returnSlide),slide=lecture.slides[index];
  if(slide.visual?.rows?.[0]?.[0]!==item.context||slide.visual.rows[0][1]!==item.operation)throw Error('Условие вне слайда: '+item.id);
  if(lecture.slides.slice(index+1,index+5).map(s=>s.task?.type).join()!=='single,multiple,short,matching')throw Error('Практика не перед четырьмя вопросами: '+item.id);
  if(!lecture.slides.some(s=>s.id===item.id+'-concept')||!lecture.slides.some(s=>s.id===item.id+'-changed-result')||!lecture.slides.some(s=>s.id===item.id+'-notebook'))throw Error('Неполный разбор: '+item.id);
 }
 for(const group of ['primary','additional'])if(lecture.slides.filter(s=>s.kind==='literature'&&s.readingGroup===group).length!==1)throw Error('Литература разбита');
 if(!Object.values(legacy[lecture.id]).every(id=>ids.has(id)))throw Error('Старые ссылки потеряны');
 if(Object.keys(legacy[lecture.id]).length!==baseline.decks.find(l=>l.id===lecture.id).slides.length)throw Error('Неполная карта ссылок');
}
if(cases.length!==56||Object.keys(bank.keys).length!==224||Object.keys(pack.notes).length!==ids.size)throw Error('Неполный комплект');
for(const s of course.lectures.flatMap(l=>l.slides)){
 if(!pack.notes[s.id]?.script?.trim())throw Error('Нет сценария преподавателя: '+s.id);
 if(/вы научитесь|после (?:занятия|изучения) (?:вы|ты) смож|исходная лекция|MySQL 8\.4 Reference Manual/i.test(JSON.stringify(s)))throw Error('Лишняя вводная формулировка: '+s.id);
}
for(const p of courseAssets(course))if(!/^https?:/.test(p)&&!fs.existsSync('public/'+p))throw Error('Нет ресурса: '+p);
console.log(JSON.stringify({lectures:7,questions:56,cases:56,selfChecks:224,slides:ids.size,legacyLinks:595,status:'passed'}));
