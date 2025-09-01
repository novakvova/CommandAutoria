import { Link, Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div>
            <nav className="bg-white shadow rounded-xl mb-6">
                <ul className="flex space-x-6 p-4">
                    <li>
                        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">Home</Link>
                    </li>
                    <li>
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Login</Link>
                    </li>
                    <li>
                        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/nothing-here" className="text-red-500 hover:text-red-700 font-medium">Nothing Here</Link>
                    </li>
                </ul>
            </nav>

            <div className="bg-white shadow p-6 rounded-xl">
                <Outlet />
            </div>
        </div>
    );
}