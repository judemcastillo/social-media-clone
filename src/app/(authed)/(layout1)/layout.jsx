
import LeftSideBar from "@/components/sidebar/Left";
import RightSideBar from "@/components/sidebar/Right";

export default function RootLayout({ children }) {
	return (
		<div className="grid grid-cols-4 h-[93vh] ">
			<div>
				<LeftSideBar />
			</div>
			<div className="col-span-2 h-full ">{children}</div>
			<div>
				<RightSideBar />
			</div>
		</div>
	);
}
