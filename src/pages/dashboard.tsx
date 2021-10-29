import { useState, useEffect } from "react";
import Layout from "../components/layouts/main";
import useSWR from "swr";

import { Button } from "@vechaiui/react";
import { FaWrench } from "react-icons/fa";

const fetcher = async url => await axios({url, method:"GET"})

const HomePage = (props) => {
	const [ loaded, setLoaded ] = useState(false);
	const { pageTransitionReadyToEnter } = props;

	const { data, error } = useSWR("http://64.52.84.98:8082/", fetcher);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			pageTransitionReadyToEnter();
			setLoaded(true);
		}, 3000);

		return () => {
			clearTimeout(timeoutId);
		}
	}, [pageTransitionReadyToEnter]);

	const skeleton = (
		<div className="py-4 rounded shadow-md w-full animate-pulse bg-gray-900">
			<div className="flex p-4 space-x-4 sm:px-8 items-center">
				<div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-700"></div>
				<div className="flex-1 py-2 space-y-4">
					<div className="w-24 h-3 rounded bg-gray-700"></div>
					<div className="flex flex-row space-x-2 items-center">
						<div className="w-12 h-3 rounded bg-gray-700"></div>
						<p>Members</p>
					</div>
				</div>
				<div className="btn rounded-md bg-gray-700 w-12 h-12 md:w-36 space-x-2"><p className="hidden md:block">Settings </p><FaWrench /></div>
			</div>
			<div className="p-4 space-y-4 sm:px-8">
				<div className="w-3/4 h-4 rounded bg-gray-700"></div>
				<div className="w-full h-4 rounded bg-gray-700"></div>
				<div className="w-3/5 h-4 rounded bg-gray-700"></div>
			</div>
		</div>
	);

	if(!loaded) return null;

	return (
		<Layout title="WIP Dashboard">
			<section className="bg-gray-800 text-gray-100">
				<h3 className="font-bold text-2xl text-center text-green-300 mb-8">[WIP] Apollo Dashboard</h3>
				<h4 className="font-semibold text-lg mb-2">Your Servers</h4>
				{data}
				{error ? <h4>Failed to load.</h4> : !data ? skeleton : <h4>${data.data.message}</h4>}
			</section>
		</Layout>
	);
}

HomePage.pageTransitionDelayEnter = true;

export default HomePage;
