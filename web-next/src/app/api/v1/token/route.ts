import {NextRequest} from "next/server";
import {identity} from "@/lib/auth/identity";
import {guarded,reply,origin,body,ApiError} from "@/lib/core/api";
import {rateLimit} from "@/lib/core/db";
import {tokenState,createToken} from "@/lib/rdp/token";
export async function GET(req:NextRequest){return guarded(async()=>{const who=await identity(req);return reply(await tokenState(who.subject))})}
export async function POST(req:NextRequest){return guarded(async()=>{origin(req);const who=await identity(req);
  if(!await rateLimit("rdp-token:"+who.subject,3,600))throw new ApiError(429,"Terlalu sering. Coba lagi beberapa menit.");
  const b=await body(req);const t=await createToken(who.subject,who.login,typeof b.email==="string"?b.email:"");return reply({token:t.token,expires:t.expires},201)})}
