import { useState } from "react";

import SEO from "../meta/SEO";
import Header from "../ui/Header";
import Sidebar from "../ui/Sidebar";

export default function MainLayout({ children, ...rest }) {
	const [ sidebarOpen, setSidebarOpen ] = useState(false);

	return (
		<>
			<SEO {...rest} />
			<div className="min-h-screen bg-gray-800 text-gray-100 overflow-hidden">
				<Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
				<div className="p-6 space-y-8">
					<Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
					<main>
						<div className="container mx-auto space-y-16">
							{children}
						</div>
					</main>
				</div>
			</div>
		</>
	);
}
