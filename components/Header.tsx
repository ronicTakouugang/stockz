import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";

const Header = () => {
    return (
       <header className="sticky top-0 header">
           <div className="container header-wrapper">
               <Link href="/">
                   <Image src="/assets/icons/logo.svg" alt="Stockz" width={220} height={50} className="h-12 w-auto cursor-pointer" />
               </Link>
               <nav className="hidden sm:block">
                   <NavItems />
               </nav>
               {/* User DropDown*/}
           </div>
       </header>
    )
}
export default Header
