import {initialLocks,command,waitEdges} from '../src/learning/lockModel.ts';
import {lockRuns} from '../authoring/case-scenarios.mjs';
const values=o=>Object.entries(o).map(([k,v])=>'PK '+k+' = '+v).join('; ')||'нет';
export function describeLocks(s) {
 return 'Зафиксировано: '+values(s.committed)+'.\n'+['A','B'].map(a=>{const t=s.transactions[a];return a+': '+(!t.connected?'отключён':t.waiting?'ожидает '+t.waiting.operation+' PK '+t.waiting.key:t.running?'выполняет SLEEP':t.active?'транзакция открыта':'вне транзакции')+'; собственные изменения: '+values(t.writes)+'; блокировки: '+(t.locks.join(', ')||'нет')+'.'}).join('\n')+'\nГраф: '+(waitEdges(s).map(e=>e.from+' → '+e.to+' ('+e.label+')').join('; ')||'ожиданий строк нет')+(s.lastRead?'\nПоследнее чтение: '+s.lastRead.actor+', '+s.lastRead.kind+', PK '+s.lastRead.key+' = '+s.lastRead.value+'.':'')+(s.lastCycle.length?'\nЦикл до отката: '+s.lastCycle.join('; ')+'.':'');
}
export function lockRoute(item,index) {
 return lockRuns[index].map(run=>{
  let state=initialLocks(item.model);
  const setup='Нажмите «Вернуть исходные данные». Начальный снимок:\n'+describeLocks(state)+'\nУже выполненные операции не повторяйте. В полях «Сеанс» и «PK» выбирается адресат следующей команды. У KILL это сеанс-цель; вмешивается администратор, а не зависший клиент. Для BEGIN, COMMIT, ROLLBACK, KILL и RECONNECT выбранный PK не влияет на действие.';
  const steps=run.steps.map(([actor,op,key])=>{
   const previous=state;state=command(state,actor,op,key);
   let why;
   if(op==='BEGIN')why='Открыта явная транзакция; сами данные пока не меняются.';
   if(op==='SELECT')why='Обычное согласованное чтение не запрашивает блокировку. В своей транзакции видны собственные изменения; для остальных строк используется её снимок REPEATABLE READ. Вне транзакции читается текущее зафиксированное значение.';
   if(op==='UPDATE'||op==='FOR UPDATE')why=state.lastCycle.length?'Замкнулся цикл ожиданий. Модель откатывает всю транзакцию запрашивающего '+actor+'; это учебное правило выбора жертвы, реальный InnoDB может выбрать иначе. Сразу покажите блок «Обнаруженный цикл до отката» и журнал: следующая команда убирает этот блок.':state.transactions[actor].waiting?'Ресурс удерживает другой сеанс: запрос поставлен в ожидание, собственного изменения этой строки ещё нет. Следующий шаг выполняется в указанном владельце, повторять заблокированный запрос не нужно.':op==='UPDATE'?'UPDATE вычитает 1 из актуального значения строки и удерживает блокировку до завершения транзакции; зафиксированный столбец пока не меняется.':'Блокирующее чтение получает актуальное значение и удерживает строку; это не чтение из прежнего согласованного снимка.';
   if(op==='COMMIT'||op==='ROLLBACK')why=(op==='COMMIT'?'Собственные изменения фиксируются.':'Собственные изменения отменяются.')+' Блокировки этого сеанса освобождаются.'+(['A','B'].some(a=>previous.transactions[a].waiting&&!state.transactions[a].waiting)?' Ожидавший запрос автоматически продолжается; его изменения ещё требуют отдельного COMMIT. Повторный UPDATE уменьшил бы строку лишний раз.':'');
   if(op==='KILL QUERY')why='Отменена текущая команда SLEEP. Транзакция A и её блокировка остаются; B продолжает ждать. Отдельный ROLLBACK необходим для освобождения строки.';
   if(op==='KILL CONNECTION')why='Соединение A закрывается, вся его незавершённая транзакция откатывается. Освобождение строки автоматически продолжает ожидающий UPDATE B; он пока не зафиксирован.';
   if(op==='RECONNECT')why='Создан новый пустой сеанс. Старые изменения и блокировки не восстанавливаются.';
   return {action:'Выберите «Сеанс» = '+actor+(op==='UPDATE'||op==='SELECT'||op==='FOR UPDATE'?', «PK» = '+key:'')+'; нажмите «'+op+'».',expected:describeLocks(state)+'\nПоследняя запись журнала: '+state.log.at(-1),why};
  });
  return {name:run.name,setup,steps,conclusion:'Контроль итога: '+values(run.committed)+'. '+(['A','B'].some(a=>state.transactions[a].active)?'Оставшиеся открытые транзакции видны в снимке; зафиксированные и собственные значения не смешивайте. Следующий независимый проход начинайте сбросом.':'Обе транзакции завершены. Перед следующим вариантом восстановите исходный снимок.')};
 });
}

