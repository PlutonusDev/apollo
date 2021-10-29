import Image from "next/image";
import loader from "../img/loader.gif";

export default function Loader() {
	return (
		<div className="bg-gray-800 flex flex-col items-center justify-center h-screen w-full">
			<Image src={loader} />
			<h4 className="font-bold text-2xl animate-pulse text-green-400">Loading</h4>
		</div>
	);
}
