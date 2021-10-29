import { useEffect, useRef } from "react";

import SidebarNavLink from "./SidebarNavLink";

import { HiHome, HiColorSwatch, HiChatAlt2, HiCode } from "react-icons/hi";
import { MdExitToApp } from "react-icons/md";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
	const sidebar = useRef(null);

	useEffect(() => {
		const clickHandler = ({ target }) => {
			if(!sidebar.current) return;
			if(!sidebarOpen || sidebar.current.contains(target)) return;
			setSidebarOpen(false);
		}

		document.addEventListener("click", clickHandler);
		return () => document.removeEventListener("click", clickHandler);
	});

	useEffect(() => {
		const keyHandler = ({ keyCode }) => {
			if(!sidebarOpen || keyCode !== 27) return;
			setSidebarOpen(false);
		}

		document.addEventListener("keydown", keyHandler);
		return () => document.removeEventListener("keydown", keyHandler);
	});

	return (
		<>
			{/* Backdrop, mobile only */}
			<div className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} aria-hidden="true"></div>

			<div ref={sidebar} className={`h-full p-3 space-y-2 w-64 bg-gray-900 text-gray-100 absolute z-40 left-0 top-0 h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-64"}`}>
				{/* TODO: Get user session (& info) dynamically */}
				<div className="flex items-center p-2 space-x-4">
					<img src={`https://source.unsplash.com/100x100/?portrait`} alt="" className="w-12 h-12 rounded-full" />
					<div>
						<h2 className="text-lg font-semibold">{`Username`}</h2>
						<span className="flex items-center space-x-1">
							<a href="/profile" className="text-xs hover:underline text-gray-400">View Profile</a>
						</span>
					</div>
				</div>
				<div className="divide-y divide-gray-700">
					<ul className="pt-2 pb-4 space-y-1 text-sm">
						{/* Sidebar Tabs */}
						<SidebarNavLink href="/home" icon={<HiHome/>} title="Home" />
						<SidebarNavLink href="/dashboard" icon={<HiColorSwatch/>} title="Dashboard" />
						{/*<li className="py-2"><hr/></li>
						<SidebarNavLink href="/servers" icon={<HiChatAlt2/>} title="Find Servers" />
						<SidebarNavLink href="/bots" icon={<HiCode/>} title="Find Bots" />*/}
						<li className="py-2"><hr/></li>
						<SidebarNavLink href="/logout" className="bg-red-600" icon={<MdExitToApp/>} title="Logout" />
					</ul>
				</div>
			</div>
		</>
	);
}
