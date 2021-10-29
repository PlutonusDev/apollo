import "tailwindcss/tailwind.css";
import { PageTransition } from "next-page-transitions";
import Loader from "../components/meta/loader";

export default function App({ Component, pageProps }) {
	return (
		<>
			<PageTransition
				timeout={300}
				classNames="page-transition"
				loadingComponent={<Loader />}
				loadingDelay={200}
				loadingTimeout={{
					enter: 200,
					exit: 200
				}}
				loadingClassNames="loading-indicator"
			>
				<Component {...pageProps} />
			</PageTransition>

			<style jsx global>{`
				.page-transition-enter {
					opacity: 0;
				}

				.page-transition-enter-active {
					opacity: 1;
					transition: opacity 200ms;
				}

				.page-transition-exit {
					opacity: 1;
				}

				.page-transition-exit-active {
					opacity: 0;
					transition: opacity 200ms;
				}

				.loading-indicator-appear, .loading-indicator-enter {
					opacity: 0;
				}

				.loading-indicator-appear-active, .loading-indicator-enter-active {
					opacity: 1;
					transition: opacity 200ms;
				}
			`}</style>
		</>
	);
}
