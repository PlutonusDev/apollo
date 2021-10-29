import { useRouter } from "next/router";

export default function SidebarNavLink(props) {
	const router = useRouter();

	return (
		<li className={`${props.className || ""} text-lg rounded-sm ${router.asPath === props.href ? "bg-gray-700" : "hover:bg-gray-800"}`}>
			<a href={props.href} className="flex items-center p-2 space-x-3">
				{props.icon}
				<span>{props.title}</span>
			</a>
		</li>
	);
}
