import { useEffect } from "react";
import { useRouter } from "next/router";

export default function IndexPage() {
	const router = useRouter();

	useEffect(() => {router.asPath === "/" && router.push("/dashboard")}, []);
	return <h3>Please wait...</h3>;
}
