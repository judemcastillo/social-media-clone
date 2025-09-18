import Header from "@/components/Header";
import LeftSideBar from "@/components/sidebar/Left";
import RightSideBar from "@/components/sidebar/Right";

export default function RootLayout({ children }) {
	return (
		<div className="bg-sky-50">
			<div className="col-span-4 border-none  shadow-lg z-50 h-[7vh] bg-white">
				<Header />
			</div>
			<div className="grid grid-cols-4 h-[93vh] ">
				<div>
					<LeftSideBar />
				</div>
				<div className="col-span-2 h-full ">{children}</div>
				<div>
					<RightSideBar />
				</div>
			</div>
		</div>
	);
}
