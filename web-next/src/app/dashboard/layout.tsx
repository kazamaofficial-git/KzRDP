import PageGuide from "@/components/dashboard/page-guide";
import CommunityPresence from "../../components/dashboard/community-presence";
import Navigation from "@/components/dashboard/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth/auth";
import {redirect} from "next/navigation";
import ConnectionGate from "../../components/dashboard/connection-gate";
export default async function Layout({children}:{children:React.ReactNode}){const session=await getServerSession(authOptions);if(!session)redirect("/login");return <><Navigation name={session.user?.name} image={session.user?.image}/><main><PageGuide/><ConnectionGate>{children}</ConnectionGate>{session.role!=="admin"&&<CommunityPresence/>}</main><footer>Credit: Kazama Tech</footer></>}
