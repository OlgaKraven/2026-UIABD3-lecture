export const table=(columns,rows)=>({kind:'table',columns,rows:rows.map(r=>r.map(String))});
export const chain=(...items)=>({kind:'chain',items});
export const bars=(unit,max,rows)=>({kind:'bars',unit,max,rows:rows.map(([label,value])=>({label,value}))});
export const timeline=(unit,max,rows)=>({kind:'timeline',unit,max,rows:rows.map(([label,start,end,state])=>({label,start,end,state}))});
export const graph=(nodes,edges)=>({kind:'graph',nodes:nodes.map(([id,title,text])=>({id,title,text})),edges:edges.map(([from,to,label])=>({from,to,label}))});
export const unit=(definition,paragraphs,input,board,result,changed,changedResult,caseContext,operation,solution,model,test)=>({definition,paragraphs,input,board,result,changed,changedResult,case:{context:caseContext,operation,solution,model},test});
export const question=(prompt,options,correct,explanation)=>({prompt,options,correct,explanation});
