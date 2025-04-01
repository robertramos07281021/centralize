import { useQuery } from "@apollo/client"
import { Link, useLocation } from "react-router-dom"
import { UserInfo } from "../middleware/types"
import { myUserInfos } from "../apollo/query"

const NavbarExtn = () => {
  const {data} = useQuery<{ getMe: UserInfo }>(myUserInfos)
  const location = useLocation()
  const accountsNavbar = {
    ADMIN: [
      {
        name: "Dashboard",
        link: "/admin-dashboard"
      },
      {
        name: "Accounts",
        link: "/accounts"
      },
      {
        name: "Branch & Depts",
        link: "/setup"
      },
    ],
    AGENT: [
      {
        name: "Dashboard",
        link: "/agent-dashboard"
      },
      {
        name: "Disposition",
        link: "/agent-disposition"
      }
    ],
    TL: [
      {
        name: "Dashboard",
        link: "/tl-dashboard"
      },
      {
        name: "Disposition",
        link: "/tl-disposition"
      },
      {
        name: "Outcome Extractor",
        link: "/outcome-extractor"
      }
    ]
  }

  const userType = data?.getMe?.type as keyof typeof accountsNavbar;

  if (!userType || !accountsNavbar[userType]) return null; 

  return (
    <div className="border-y border-slate-300 flex items-center justify-center text-base font-medium text-slate-500 bg-white">
      {
        accountsNavbar[userType].map((an,index) => 
        <Link key={index} to={an.link}>
          <div className={`${index > 0 && "border-l"} ${location.pathname.includes(an.link) && "bg-slate-200"} border-slate-300 py-2 px-2 hover:bg-slate-200 hover:text-black/60`}>
            {an.name}
          </div>
        </Link>
        )
      }
    </div>
  )
}

export default NavbarExtn
