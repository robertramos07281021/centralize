import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"

const NavbarExtn = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
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
        name: "Production Area",
        link: "/agent-production-area"
      },
      {
        name: "Statistics",
        link: "/agent-statistics"
      }
    ],
    TL: [
      {
        name: "Dashboard",
        link: "/tl-dashboard"
      },
      {
        name: "Production Area",
        link: "/tl-production-area"
      },
      {
        name: "Task Manager",
        link: "/tl-task-manager"
      },
      {
        name: "Reports",
        link: "/tl-reports"
      },
    ]
  }

  const userType = userLogged?.type as keyof typeof accountsNavbar;

  if (!userType || !accountsNavbar[userType]) return null; 

  return (
    <div className="border-y border-slate-300 flex items-center justify-center text-base font-medium text-slate-500 bg-white print:hidden">
      {
        accountsNavbar[userType].map((an,index) => 
        <Link key={index} to={an.link}>
          <div className={`${index > 0 && "border-l"} ${location.pathname.includes(an.link) && "bg-slate-200"} text-xs border-slate-300 py-2 w-44 text-center hover:bg-slate-200 hover:text-black/60`}>
            {an.name}
          </div>
        </Link>
        )
      }
    </div>
  )
}

export default NavbarExtn
