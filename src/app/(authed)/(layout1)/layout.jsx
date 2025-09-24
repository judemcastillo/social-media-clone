
import LeftSideBar from "@/components/sidebar/Left";
import RightSideBar from "@/components/sidebar/Right";

export default function RootLayout({ children }) {
	return (
		<div className="grid lg:grid-cols-4 h-[93vh] grid-cols-2">
			<div className="hidden lg:block col-span-1 ">
				<LeftSideBar />
			</div>
			<div className="col-span-2 h-full ">{children}</div>
			<div className="hidden lg:block col-span-1 ">
				<RightSideBar />
			</div>
		</div>
	);
}
