import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePageSkeleton() {
	return (
		<main className=" max-h-[93vh] overflow-y-auto  mx-auto flex flex-col items-center w-full scrollbar-none">
			<div className="max-w-[700px] w-full px-5 md:px-0 pb-10">
				{/* Header skeleton (cover, avatar, actions) */}
				<Card className="w-full  rounded-t-xl border-t-0 mt-8 shadow-lg flex flex-col pb-0 rounded-b-none pt-0">
					<div className="grid grid-cols-4 grid-rows-3 w-full h-55">
						<Skeleton className="col-span-4 row-span-2 rounded-t-xl h-40" />
						<div className="row-span-2 col-span-1 m-auto col-start-1 row-start-2 -translate-x-4">
							<Skeleton
								className="rounded-full"
								style={{ width: 100, height: 100 }}
							/>
						</div>
						<div className="col-start-4 row-start-3 m-auto">
							<Skeleton className="h-9 w-28 rounded-md" />
						</div>
					</div>

					<div className="px-8 space-y-3 -translate-y-10 ">
						<Skeleton className="h-6 w-44" />
						<Skeleton className="h-4 w-72" />
						<div className="flex gap-2 mt-2">
							<Skeleton className="h-6 w-16" />
							<Skeleton className="h-6 w-20" />
							<Skeleton className="h-6 w-14" />
						</div>
						<div className="mt-2 flex items-center gap-6 text-sm">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				</Card>

				{/* Tabs skeleton (tabs + a few posts) */}
				<div className=" w-full max-w-[700px] flex flex-col gap-4 mx-auto h-full mt-4">
					<Card className="border-b bg-card px-4 py-0 rounded-t-none shadow-lg">
						<div className="flex gap-4 py-2">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-8 w-24" />
						</div>
					</Card>

					{[0, 1, 2].map((i) => (
						<Card
							key={i}
							className="shadow-lg flex flex-col p-5 w-full gap-2 pb-1"
						>
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-3">
									<Skeleton
										className="rounded-full"
										style={{ width: 35, height: 35 }}
									/>
									<div className="space-y-2">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-3 w-28" />
									</div>
								</div>
								<Skeleton className="h-6 w-6" />
							</div>
							<Skeleton className="h-4 w-11/12" />
							<Skeleton className="h-4 w-8/12" />
							<Skeleton className="h-40 w-full rounded-lg" />
							<div className="grid grid-cols-3 gap-2 mt-2">
								<Skeleton className="h-8" />
								<Skeleton className="h-8" />
								<Skeleton className="h-8" />
							</div>
						</Card>
					))}
				</div>
			</div>
		</main>
	);
}
