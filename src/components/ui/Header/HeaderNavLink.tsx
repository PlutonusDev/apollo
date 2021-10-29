import { useRouter } from "next/router";

export default function HeaderNavLink(props) {
	const router = useRouter();

	return (
		<li className="flex">
			<a href={props.href} className={`flex items-center -mb-0.5 px-4 ${router.asPath === props.href ? "border-b-2 text-green-300 border-green-400" : "text-gray-100"}`}>{props.title}</a>
		</li>
	);
}
