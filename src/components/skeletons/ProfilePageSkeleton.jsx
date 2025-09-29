import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePageSkeleton() {
	return (
		<main className=" max-h-[93vh] overflow-y-auto  mx-auto flex flex-col items-center w-full scrollbar-none">
			<div className="max-w-[700px] w-full px-5 md:px-0 pb-10">
				{/* Header skeleton (cover, avatar, actions) */}
				<Card className="w-full  rounded-t-xl border-t-0 mt-8 shadow-lg flex flex-col pb-0 rounded-b-none pt-0">
					<div className="grid grid-cols-4 grid-rows-3 w-full h-55">
						<Skeleton className="col-span-4 row-span-2 rounded-t-xl h-40 bg-muted-foreground p-0 col-start-1 row-start-1" />
						<div className="row-span-2 col-span-1 m-auto col-start-1 row-start-2 md:-translate-x-4 bg-card rounded-full border-5 border-card">
							<Skeleton
								className="rounded-full bg-muted-foreground"
								style={{ width: 90, height: 90 }}
							/>
						</div>
						<div className="col-start-4 row-start-3 m-auto bg-card">
							<Skeleton className="h-9 w-28 rounded-md bg-muted-foreground" />
						</div>
					</div>

					<div className="px-8 space-y-3 -translate-y-10 ">
						<Skeleton className="h-6 w-44 bg-muted-foreground" />
						<Skeleton className="h-4 w-72 bg-muted-foreground" />
						<div className="flex gap-2 mt-2">
							<Skeleton className="h-6 w-16 bg-muted-foreground" />
							<Skeleton className="h-6 w-20 bg-muted-foreground" />
							<Skeleton className="h-6 w-14 bg-muted-foreground" />
						</div>
						<div className="mt-2 flex items-center gap-6 text-sm">
							<Skeleton className="h-4 w-24 bg-muted-foreground" />
							<Skeleton className="h-4 w-24 bg-muted-foreground" />
						</div>
					</div>
				</Card>

				{/* Tabs skeleton (tabs + a few posts) */}
				<div className=" w-full max-w-[700px] flex flex-col gap-4 mx-auto h-full ">
					<Card className="border-b bg-card px-4 py-0 rounded-t-none shadow-lg">
						<div className="flex gap-4 py-2">
							<Skeleton className="h-5 w-16 bg-muted-foreground" />
							<Skeleton className="h-5 w-24 bg-muted-foreground" />
							<Skeleton className="h-5 w-24 bg-muted-foreground" />
						</div>
					</Card>

					{[0, 1].map((i) => (
						<Card
							key={i}
							className="shadow-lg flex flex-col p-5 w-full gap-2 pb-1"
						>
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-3">
									<Skeleton
										className="rounded-full bg-muted-foreground"
										style={{ width: 50, height: 50 }}
									/>
									<div className="space-y-2">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-3 w-28" />
									</div>
								</div>
								<Skeleton className="h-6 w-6 bg-muted-foreground" />
							</div>
							<Skeleton className="h-4 w-11/12 bg-muted-foreground" />
							<Skeleton className="h-4 w-8/12 bg-muted-foreground" />
							<Skeleton className="h-30 w-full rounded-lg bg-muted-foreground" />
							<div className="grid grid-cols-3 gap-2 mt-2 ">
								<Skeleton className="h-8 bg-muted-foreground" />
								<Skeleton className="h-8 bg-muted-foreground" />
								<Skeleton className="h-8 bg-muted-foreground" />
							</div>
						</Card>
					))}
				</div>
			</div>
		</main>
	);
}
