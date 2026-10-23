import {NextRequest,NextResponse} from "next/server";
import {readToken} from "./lib/auth/session";
import {dashboardRoute} from "./lib/routing/dashboard-route";
export async function middleware(req:NextRequest){
 const token=await readToken(req);
 const result=dashboardRoute(req.nextUrl.pathname,token?.authKind==='github'&&typeof token.login==='string'?token.login:null,token?.authKind==='admin');
 let response:NextResponse;
 if(result.kind==='reject')response=new NextResponse('Not found',{status:404});
 else if(result.kind==='login')response=NextResponse.redirect(new URL('/login',req.url));
 else if(result.kind==='redirect'){const url=req.nextUrl.clone();url.pathname=result.path;response=NextResponse.redirect(url)}
 else response=NextResponse.next();
 response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');return response;
}
export const config={matcher:['/dashboard/:path*']};
