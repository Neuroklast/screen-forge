import {describe,it,expect} from 'vitest';
import {sequences,sequenceDuration,sequenceState} from '../scenes/os/sequences';
import {osReducer,initialOsState} from '../scenes/os/state';
import {projectTesseract} from '../scenes/os/Visuals';
import {schema,defaults} from './config';
describe('timecoded choreography',()=>{
 it('resolves every phase boundary, scaled duration, completion and backward seek',()=>{for(const s of sequences){for(const scale of [.25,1,4]){let at=0;s.phases.forEach((p,index)=>{const state=sequenceState(s,at,scale);expect(state.index).toBe(index);expect(state.phaseProgress).toBeCloseTo(0);at+=p.duration*scale;});expect(sequenceDuration(s,scale)).toBe(at);expect(sequenceState(s,at+100,scale).done).toBe(true);expect(sequenceState(s,at,scale).phaseProgress).toBe(1);expect(sequenceState(s,-4,scale).index).toBe(0);}}});
 it('chains the full boot and intrusion before the warning phase',()=>{const op=sequences.find(s=>s.id==='operation')!;expect(sequenceDuration(op)).toBe(256);expect(sequenceState(op,238).phase.channel).toBe('ALERT.07');expect(sequenceState(op,0).phase.name).toBe('Power domain isolation');});
 it('counts completed jobs only on completion, and aborts without a result',()=>{let state=osReducer(initialOsState,{type:'run',id:'boot',time:17,multiplier:2});expect(state.sequence?.startedAt).toBe(17);state=osReducer(state,{type:'closeSequence',completed:false});expect(state.history).toEqual([]);state=osReducer(state,{type:'run',id:'decrypt',time:20,multiplier:1});state=osReducer(state,{type:'closeSequence',completed:true});expect(state.history).toEqual(['decrypt']);expect(osReducer(state,{type:'reset'})).toEqual(initialOsState);});
 it('keeps projected 4D vertices finite over rotation',()=>{for(let a=0;a<7;a+=.13){const points=projectTesseract(a,a*.7);expect(points).toHaveLength(16);points.forEach(p=>{expect(Number.isFinite(p.x)).toBe(true);expect(Number.isFinite(p.y)).toBe(true);});}});
 it('loads older presets and rejects malformed overlay controls',()=>{const legacy:any={...defaults()};delete legacy.overlays;delete legacy.sceneOptions;expect(schema.parse(legacy).overlays.scanlines).toBe(.35);expect(schema.parse(legacy).sceneOptions.os.sequenceScale).toBe(1);expect(schema.safeParse({...defaults(),overlays:{glow:2}}).success).toBe(false);});
});
