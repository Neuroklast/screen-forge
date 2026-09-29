import {expect,it} from 'vitest';
import {defaults} from './config';
import {nextStep,triggerMatches,showSchema,type Step,type Show} from './director';
import {showTemplateLabels, showTemplates} from './showTemplates';
import {warheadState} from '../scenes/shared/Warhead';
const a:Step={id:'a',name:'A',config:defaults(),cue:'idle',operation:'',trigger:'time',duration:5,value:'Enter',next:''};const b={...a,id:'b'};const show:Show={version:1,name:'test',steps:[a,b]};
it('advances sequential and explicit links and validates missing targets',()=>{expect(nextStep(show,'a')?.id).toBe('b');expect(nextStep(show,'b')).toBe(null);expect(nextStep({...show,steps:[{...a,next:'end'},b]},'a')).toBe(null);expect(showSchema.safeParse({...show,steps:[{...a,next:'missing'},b]}).success).toBe(false);expect(showSchema.safeParse({...show,steps:[a,a]}).success).toBe(false);});
it('input gates match type and value and cannot be skipped by time',()=>{expect(triggerMatches(a,4)).toBe(false);expect(triggerMatches(a,5)).toBe(true);expect(triggerMatches({...a,trigger:'pin',value:'2048'},99,{type:'key',value:'2048'})).toBe(false);expect(triggerMatches({...a,trigger:'pin',value:'2048'},99,{type:'pin',value:'2048'})).toBe(true);});
it('warhead neutralization requires both completed handovers and precedes expiry',()=>{expect(warheadState(20,180,null,null,15).safe).toBe(false);expect(warheadState(20,180,0,null,15).safe).toBe(false);expect(warheadState(20,180,0,9,17).safe).toBe(true);expect(warheadState(20,180,0,9,17).left).toBe(160);expect(warheadState(16,180,0,9,17).safe).toBe(false);expect(warheadState(180,180,0,9,178).expired).toBe(true);});
it('loads every show template as a valid linked take',()=>{
  const branded={...defaults('terminal'),title:'UMBRELLA',brand:{mark:'umbrella' as const,logo:''}};
  const list=showTemplates(branded);
  expect(list.map(t=>t.name)).toEqual([...showTemplateLabels]);
  for(const t of list){
    expect(showSchema.safeParse(t.show).success).toBe(true);
    expect(t.show.steps[0]?.config.title).toBe('UMBRELLA');
  }
});
