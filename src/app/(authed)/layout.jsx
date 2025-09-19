import Header from "@/components/Header";
import LeftSideBar from "@/components/sidebar/Left";
import RightSideBar from "@/components/sidebar/Right";

export default function RootLayout({ children }) {
	return (
		<div className="bg-sky-50">
			<div className="col-span-4 border-none  shadow-lg z-50 h-[7vh] bg-white">
				<Header />
			</div>
			{children}
		</div>
	);
}
