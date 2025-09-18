import { Card } from "../ui/card";

export default function RightSideBar() {
	return (
		<div className="h-[93vh] flex flex-col gap-6 p-6 pl-28">
			<Card className="h-75 shadow-lg"></Card>{" "}
			<Card className="h-75 shadow-lg"></Card>
		</div>
	);
}
