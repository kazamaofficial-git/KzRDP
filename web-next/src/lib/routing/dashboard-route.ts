// Rute dashboard memakai alamat bersih: /dashboard, /dashboard/settings, dst. (tanpa username).
const sections=new Set(['','connection','setup','folder','settings','logs','devices','games','token']);
type Result={kind:'redirect';path:string}|{kind:'next'|'reject'|'login'};
export function dashboardRoute(path:string,login:string|null,admin=false):Result{
 if(path!=='/dashboard'&&!path.startsWith('/dashboard/'))return {kind:'next'};
 if(!login&&!admin)return {kind:'login'};
 const parts=path.slice('/dashboard'.length).split('/').filter(Boolean).map(v=>{try{return decodeURIComponent(v)}catch{return '!invalid'}});
 // Alamat lama berbentuk /dashboard/@username/halaman dialihkan ke alamat bersih.
 if(parts[0]?.startsWith('@')){
  if(parts.length>2||!sections.has(parts[1]||''))return {kind:'reject'};
  return {kind:'redirect',path:'/dashboard'+(parts[1]?'/'+parts[1]:'')};
 }
 if(parts.length>1||!sections.has(parts[0]||''))return {kind:'reject'};
 return {kind:'next'};
}
export function plainDashboardPath(path:string){return path.replace(/^\/dashboard\/@[^/]+(?=\/|$)/,'/dashboard')}
