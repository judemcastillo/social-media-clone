import { fetchPosts } from "@/lib/helpers/fetch";
import { Card } from "../ui/card";
import Image from "next/image";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export default async function PostsFeed() {
	const { posts, nextCursor } = await fetchPosts();
	if (!posts) return <>No Yaps to show</>;
	return (
		<div className=" w-full space-y-3 max-w-[700px] flex flex-col items-center">
			{posts.map((p) => (
				<Card className="shadow-lg flex flex-col p-5 w-full gap-4">
					<div className="flex items-center gap-2 flex-row">
						{p.author.image ? (
							<Image
								src={p.author.image}
								alt={p.author.name || p.author.email}
								width={30}
								height={30}
								className="rounded-full"
							/>
						) : (
							<div
								className="size-8 rounded-full bg-zinc-300"
								alt={p.author.name || p.author.email}
							/>
						)}
						<div className="flex flex-col items-start justify-center">
							{p.author.name || p.author.email}
							<span className="opacity-60 text-xs ">
								{new Date(p.createdAt).toLocaleString()}
							</span>
						</div>
					</div>
					<div className="whitespace-pre-wrap text-sm mt-1">{p.content}</div>
					<hr />
					<div className="flex flex-row justify-between text-sm px-8">
						<button>Like</button>
						<button>Comment</button>
						<button>Share</button>
					</div>
				</Card>
			))}
		</div>
	);
}
