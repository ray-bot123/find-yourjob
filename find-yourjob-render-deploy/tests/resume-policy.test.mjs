import test from 'node:test';
import assert from 'node:assert/strict';
import {validateResumeSize} from '../dist/resume-policy.js';
test('resume upload is strictly under 5 decimal MB',()=>{
  assert.equal(validateResumeSize(4_999_999),true);
  for(const size of [0,-1,5_000_000,5_000_001,NaN,Infinity]) assert.equal(validateResumeSize(size),false);
});
