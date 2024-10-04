import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout: React.FC = () => {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    )
}

export default Layout