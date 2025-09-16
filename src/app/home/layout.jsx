import Header from "@/components/Header";
import LeftSideBar from "@/components/sidebar/Left";

export default function RootLayout({ children }) {
	return (
		<>
			<div className="col-span-4 border-none  shadow-lg">
				<Header />
			</div>
			<div className="grid grid-cols-4 h-[93vh]">
				<div>
					<LeftSideBar />
				</div>
				<div className="col-span-2 h-full border-l-2 border-r-2">
					{children}
				</div>
				<div></div>
			</div>
		</>
	);
}
