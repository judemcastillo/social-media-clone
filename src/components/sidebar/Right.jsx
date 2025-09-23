import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";

export default function RightSideBar() {
	return (
		<div className="h-[93vh] flex flex-col gap-6 justify-start p-6  ">
			<Card className="h-75 ">
				<CardHeader>
					<CardTitle>Updates</CardTitle>
				</CardHeader>
				<CardContent>
					<CardTitle>Welcome to YapSpace!</CardTitle>
					<CardDescription className="mt-2 text-sm">
						Lorem ipsum dolor sit amet consectetur, adipisicing elit. Unde sunt
						ad deserunt quibusdam enim facilis itaque facere est fugiat
						voluptatibus libero omnis adipisci, eaque necessitatibus debitis
						placeat totam vel eligendi.
					</CardDescription>
				</CardContent>
			</Card>
			<Card className="h-75 ">
				<CardHeader>
					<CardTitle className="text-lg font-semibold">
						Yappers you may know
					</CardTitle>
				</CardHeader>
			</Card>
		</div>
	);
}
