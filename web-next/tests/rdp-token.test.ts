import {test} from 'node:test';import assert from 'node:assert/strict';
import {newToken,TOKEN_RE,maskEmail,EMAIL_RE,normalize} from '../src/lib/rdp/token';
test('token format, normalisation and email masking',()=>{
 for(let i=0;i<50;i++)assert.match(newToken(),TOKEN_RE);
 assert.equal(normalize(' rdp-abcdefghjk '),'RDP-ABCDEFGHJK');
 assert.equal(maskEmail('owner@example.com'),'o***@e***.com');
 assert.ok(EMAIL_RE.test('a@b.co'));assert.ok(!EMAIL_RE.test('a b@c.co'));assert.ok(!EMAIL_RE.test('nope'));
});
