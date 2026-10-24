import {it,expect} from 'vitest'
import course from '../public/course.json'
import legacy from '../public/legacy-links.json'
import cases from '../authoring/cases.json'
it('keeps a practical passport directly before four self checks',()=>{for(const c of cases){const lecture=course.lectures.find(l=>l.id===c.lectureId)!,index=lecture.slides.findIndex(s=>s.id===c.returnSlide);expect(lecture.slides.slice(index+1,index+5).map(s=>'task'in s?s.task?.type:undefined)).toEqual(['single','multiple','short','matching'])}})
it('maps every original numeric slide to a surviving semantic slide',()=>{const ids=new Set(course.lectures.flatMap(l=>l.slides.map(s=>s.id)));expect(Object.values(legacy).flatMap(l=>Object.values(l))).toHaveLength(595);for(const l of Object.values(legacy))for(const id of Object.values(l))expect(ids.has(id)).toBe(true)})
