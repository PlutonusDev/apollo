import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomePage() {
	const router = useRouter();

	useEffect(() => {router.asPath === "/home" && router.push("/dashboard")}, []);
	return <h3>Page disabled... redirecting...</h3>;
}
