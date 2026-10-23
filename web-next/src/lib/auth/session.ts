import {getToken} from "next-auth/jwt";
import {SITE_ORIGIN} from "../config/brand";
// Cookie sesi memakai awalan __Secure- karena situs berjalan di HTTPS. getToken menebak ini dari NEXTAUTH_URL
// yang tidak selalu tersedia di middleware, jadi nilainya ditetapkan eksplisit di sini.
export const secureCookie=SITE_ORIGIN.startsWith("https://");
type Req=Parameters<typeof getToken>[0]["req"];
export function readToken(req:Req){return getToken({req,secret:process.env.NEXTAUTH_SECRET,secureCookie});}
