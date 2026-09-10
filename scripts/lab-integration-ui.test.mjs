import { test, beforeEach, afterEach, mock } from 'node:test';
import { createRequire } from 'node:module';
// Composed shell imports scoped styles; Node probes behavior, browser QA owns geometry.
createRequire(import.meta.url).extensions['.css'] = m => { m.exports = {}; };
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { source } from './velocity/test-source-loader.mjs';
const dom = new JSDOM('<body><div id="root"></div></body>', { url: 'https://lab.example.org/lab/feed/?field=neurotech' });
for (const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','MouseEvent','KeyboardEvent','localStorage']) globalThis[key] = dom.window[key];
globalThis.self = window; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
window.HTMLDialogElement.prototype.close = function () { this.open = false; };
const { createRoot } = await import('react-dom/client');
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa', other = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb';
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa';
let root, identity, scope, calls, authorizations, config, stored, failRead, deleted;
const identityModule = source('lib/lab-identity.ts');
const services = source('components/lab/LabShell.tsx');
const Editor = source('components/lab/RecordEditor.tsx').default;
const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.includes(text));
const click = async text => { assert.ok(button(text), text); await act(async () => { button(text).click(); await new Promise(resolve => setTimeout(resolve, 20)); }); };
const mount = async (C=Editor, props={ kind:'note', initial:{ text:'Injected transport fixture' }, onClose(){} }) => act(async () => { root.render(React.createElement(C, props)); await new Promise(resolve=>setTimeout(resolve,20)); });
const change = async (selector, value) => { const el = document.querySelector(selector); await act(() => { Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new window.Event('input',{ bubbles:true })); }); };
beforeEach(() => {
 localStorage.clear(); calls=[]; authorizations=[]; scope='atproto'; failRead=false; stored=null; deleted=false;
 config=source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL:window.location.origin, LAB_ENABLE_PUBLISH:'true' });
 const session={ sub:did, did, getTokenInfo:async()=>({ sub:did, scope, aud:'https://pds.example.org' }), fetchHandler:async(path,init)=>{
   calls.push([path,init]);
   if (path.includes('createRecord') || path.includes('putRecord')) { const body=await new Response(init.body).json(); stored={ uri:`at://${did}/${body.collection}/${body.rkey}`, cid, value:body.record }; return Response.json({ uri:stored.uri,cid }); }
   if (path.includes('deleteRecord')) { deleted=true; return Response.json({}); }
   if (deleted) return Response.json({error:'RecordNotFound'},{status:400});
   if (failRead) return Response.json({error:'InternalServerError'},{status:500});
   return Response.json(stored);
 } };
 identity={ session:{did,handle:did}, oauthSession:session,isAuthenticated:true,isLoading:false,error:null,authorizeWrite:async(...args)=>{authorizations.push(args);scope=`atproto repo:org.plresearch.lab.${args[0]}?action=${args[1]}`;}, logout:async()=>{}, login:async()=>{} };
 mock.method(identityModule,'useLabIdentity',()=>identity);
 mock.method(services,'useLab',()=>({capabilities:config,openLogin(){}}));
 mock.method(globalThis,'fetch',async path=>{assert.equal(path,'/api/lab/capabilities/');return Response.json(config);});
 root=createRoot(document.getElementById('root'));
});
afterEach(async()=>{await act(()=>root.unmount());mock.restoreAll();});
test('identity is the dedicated Lab hook, not a placeholder or legacy CMS context', () => {
 identityModule.useLabIdentity.mock.restore();
 mock.method(source('lib/lab-auth.tsx'), 'useLabAuth', () => identity);
 assert.equal(identityModule.useLabIdentity().oauthSession, identity.oauthSession);
 assert.equal(identityModule.useLabIdentity().session.did, did);
});
test('explicit granular authorization never publishes; a second review writes through SDK and shows usable URI/CID receipt',async()=>{
 await mount(); await click('Review draft');
 assert.match(document.querySelector('.lab-record-preview').textContent,/experimental/i);
 await act(()=>document.querySelector('input[type="checkbox"]').click()); await click('Publish public record');
 assert.equal(calls.length,0); assert.ok(button('Authorize'));
 await click('Authorize'); assert.equal(calls.length,0); assert.equal(authorizations.length,1);
 assert.equal(authorizations[0][0],'note'); assert.equal(authorizations[0][1],'create');
 assert.match(authorizations[0][2],/field=neurotech/);
 assert.equal(document.querySelector('input[type="checkbox"]')?.checked ?? false,false);
 await click('Review draft'); await act(()=>document.querySelector('input[type="checkbox"]').click()); await click('Publish public record');
 assert.equal(calls.length,2); assert.match(document.body.textContent,new RegExp(cid));
 assert.ok(document.querySelector(`a[href="/lab/record/?uri=${encodeURIComponent(stored.uri)}"]`));
 assert.match(document.body.textContent,/not.*peer reviewed/i);
});


test('disabled/authenticating/guest states cannot write and value edits reset consent', async()=>{
 scope='atproto repo:org.plresearch.lab.note?action=create';
 await mount(); await click('Review draft'); await act(()=>document.querySelector('input[type="checkbox"]').click());
 config={...config,canPublish:false}; await mount(); assert.equal(button('Publish public record').disabled,true);
 config={...config,canPublish:true}; identity={...identity,isLoading:true}; await mount(); assert.equal(button('Publish public record').disabled,true);
 identity={...identity,isLoading:false}; await mount(); await change('#entry-text','Changed'); assert.ok(button('Review draft')); assert.equal(calls.length,0);
 identity={...identity,isAuthenticated:false,session:null,oauthSession:null}; await mount(); assert.ok(!button('Publish public record'));
});
test('unknown write outcome survives editor remount, retains exact URI, and blocks duplicate retry', async()=>{
 scope='atproto repo:org.plresearch.lab.note?action=create'; failRead=true;
 await mount(); await click('Review draft'); await act(()=>document.querySelector('input[type="checkbox"]').click()); await click('Publish public record');
 assert.ok(document.querySelector(`a[href="/lab/record/?uri=${encodeURIComponent(stored.uri)}"]`));
 const count=calls.length;
 await act(()=>root.render(null)); await mount(); await click('Review draft');
 assert.match(document.body.textContent,/Unknown write outcome/); assert.equal(button('Publish public record').disabled,true); assert.equal(calls.length,count);
});
test('bench ignores stale account reads and edits only a displayed reviewed profile CID', async()=>{
 const Profile=source('components/lab/ProfileWorkbench.tsx').default;
 const profileData={workingOn:'Existing public profile',lookingFor:'Collaborators',interests:[]};
 const view={uri:`at://${did}/org.plresearch.lab.profile/self`,cid,kind:'profile',authorDid:did,data:profileData,record:{$type:'org.plresearch.lab.profile',community:'https://www.plrd.org/lab/',createdAt:'2025-01-01T00:00:00.000Z',...profileData},pds:'https://pds.example.org',provenance:'pds-https-unverified-signature'};
 stored={uri:view.uri,cid,value:view.record};
 let finish; const real=source('lib/lab-client.ts').createLabClient;
 mock.method(source('lib/lab-client.ts'),'createLabClient',(...args)=>({...real(...args),records:async owner=>{
   assert.equal(owner,identity.session.did);
   if (owner===other) return new Promise(resolve=>{finish=resolve});
   return {profile:profileData,profileRecord:view,records:[view],limit:30,hasMore:true,cursors:{note:'next'}};
 }}));
 await mount(Profile,{}); assert.match(document.body.textContent,/up to 30 per collection/i); assert.ok(!document.body.textContent.includes('@did:'));
 await click('Edit profile draft'); await change('#entry-workingOn','Reviewed update'); await click('Review draft');
 assert.match(document.body.textContent,new RegExp(cid));
 scope='atproto repo:org.plresearch.lab.profile?action=update';
 await act(()=>document.querySelector('input[type="checkbox"]').click()); await click('Publish public record');
 const put=calls.find(([path])=>path.includes('putRecord')); assert.ok(put); assert.equal((await new Response(put[1].body).json()).swapRecord,cid);
 await click('Cancel');
 identity={...identity,session:{did:other,handle:other}}; await mount(Profile,{});
 identity={...identity,session:{did,handle:did}}; await mount(Profile,{});
 await act(async()=>finish({profile:{...profileData,workingOn:'STALE ACCOUNT CONTENT'},profileRecord:null,records:[],limit:30,hasMore:false}));
 assert.ok(!document.body.textContent.includes('STALE ACCOUNT CONTENT'));
});


test('own deletion requires exact-record review, separate grant, and a second explicit confirm before SDK deletion',async()=>{
 const data={text:'Delete only this transport fixture',postType:'question',field:'neurotech'};
 const view={uri:`at://${did}/org.plresearch.lab.note/one`,cid,kind:'note',authorDid:did,data,record:{$type:'org.plresearch.lab.note',community:'https://www.plrd.org/lab/',createdAt:'2025-01-01T00:00:00.000Z',...data},pds:'https://pds.example.org',provenance:'pds-https-unverified-signature'};
 stored={uri:view.uri,cid,value:view.record};
 const real=source('lib/lab-client.ts').createLabClient;
 mock.method(source('lib/lab-client.ts'),'createLabClient',(...args)=>({...real(...args),records:async()=>({profile:null,profileRecord:null,records:deleted?[]:[view],limit:30,hasMore:false,cursors:{}})}));
 await mount(source('components/lab/ProfileWorkbench.tsx').default,{});
 await click('Delete this record'); assert.match(document.querySelector('dialog').textContent,new RegExp(cid)); assert.match(document.querySelector('dialog').textContent,/copies may persist/i);
 assert.equal(button('Confirm exact deletion').disabled,true);
 await act(()=>document.querySelector('dialog input[type="checkbox"]').click()); await click('Confirm exact deletion');
 assert.equal(calls.length,0); await click('Authorize deletion'); assert.equal(calls.length,0);
 await click('Delete this record'); assert.equal(document.querySelector('dialog input[type="checkbox"]').checked,false);
 await act(()=>document.querySelector('dialog input[type="checkbox"]').click()); await click('Confirm exact deletion');
 assert.equal(deleted,true); const request=calls.find(([p])=>p.includes('deleteRecord')); assert.equal((await new Response(request[1].body).json()).swapRecord,cid);
 assert.match(document.body.textContent,/RecordNotFound/); assert.equal(calls.length,3);
});
test('Lab layout mounts the isolated provider outside the shell',async()=>{
 const {createRequire}=await import('node:module'); const require=createRequire(import.meta.url); require.extensions['.css']=()=>{};
 const tree=source('app/lab/layout.tsx').default({children:'test'});
 assert.equal(tree.type,source('lib/lab-auth.tsx').LabAuthProvider);
 assert.equal(tree.props.children.type,source('components/lab/LabShell.tsx').default);
});


test('a profile opened before its read completes cannot silently adopt a newer version for publishing',async()=>{
 const props={kind:'profile',initial:{workingOn:'Local profile',lookingFor:'Tools'},profileReadReady:false,onClose(){}};
 await mount(Editor,props);
 await mount(Editor,{...props,profileReadReady:true});
 await click('Review draft'); await act(()=>document.querySelector('input[type="checkbox"]').click());
 assert.equal(button('Publish public record').disabled,true);
 assert.equal(calls.length,0);
});
test('editing a published draft clears only its old receipt, including after a remount',async()=>{
 scope='atproto repo:org.plresearch.lab.note?action=create';
 await mount(); await click('Review draft'); await act(()=>document.querySelector('input[type="checkbox"]').click()); await click('Publish public record');
 await change('#entry-text','A deliberately different next draft'); await act(()=>root.render(null)); await mount();
 assert.equal(document.querySelector('#entry-text').value,'A deliberately different next draft');
 assert.ok(!document.body.textContent.includes('Record receipt'));
 await click('Review draft'); await act(()=>document.querySelector('input[type="checkbox"]').click()); assert.equal(button('Publish public record').disabled,false);
});
