import Image from "next/image";
import HeaderNavLink from "./HeaderNavLink";

import { Button } from "@vechaiui/react";
import loader from "../../img/loader.gif";

export default function Header({ sidebarOpen, setSidebarOpen }) {
	return (
		<header className="p-4 bg-gray-800 text-gray-100">
			<div className="container flex justify-between h-8 mx-auto">
				<div className="container flex flex-row sm:space-x-4">
					<Button size="lg" variant="link" color="green" className="flex justify-end p-4 -ml-8 sm:ml-0" onClick={() => setSidebarOpen(!sidebarOpen)} aria-controls="sidebar" aria-exp>
	                                        <span className="sr-only">Open sidebar</span>
	                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
	                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
	                                        </svg>
	                                </Button>

					{/* Logo */}
					<a href="#" aria-label="Back to homepage" className="flex items-center p-2 -ml-4 sm:ml-0">
						{/* Img / svg / text here */}
						<div className="container h-12 w-12">
							<Image src={loader} />
						</div>
						<span className="text-lg font-semibold">Apollo</span>
					</a>
				</div>

				<ul className="items-stretch flex space-x-3 hidden md:flex">
					<HeaderNavLink href="/home" title="Home" />
					<HeaderNavLink href="/dashboard" title="Dashboard" />
				</ul>

				{/*<Button size="lg" variant="link" color="purple" className="flex justify-end p-4" onClick={() => setSidebarOpen(!sidebarOpen)} aria-controls="sidebar" aria-expanded={sidebarOpen}>
					<span className="sr-only">Open sidebar</span>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
					</svg>
				</Button>*/}
			</div>
		</header>
	);
}
