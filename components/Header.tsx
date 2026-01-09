import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropDown from "@/components/UserDropDown";

const Header = ({user, initialStocks}:{user:User, initialStocks: StockWithWatchlistStatus[]}) => {
    return (
       <header className="sticky top-0 header">
           <div className="container header-wrapper">
               <Link href="/">
                   <Image src="/assets/icons/logo.svg" alt="Stockz" width={220} height={50} className="h-12 w-auto cursor-pointer" />
               </Link>
               <nav className="hidden sm:block">
                   <NavItems initialStocks={initialStocks} />
               </nav>
               <UserDropDown user={user} initialStocks={initialStocks}/>
           </div>
       </header>
    )
}
export default Header
