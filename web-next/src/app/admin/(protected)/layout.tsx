import PageGuide from "@/components/dashboard/page-guide";
import Navigation from "@/components/dashboard/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth/auth";
import {redirect} from "next/navigation";
export default async function Layout({children}:{children:React.ReactNode}){const session=await getServerSession(authOptions);if(session?.role!=="admin")redirect("/admin/login");return <><Navigation admin name={session.user?.name}/><main><PageGuide/>{children}</main><footer>Credit: Kazama Tech</footer></>}
