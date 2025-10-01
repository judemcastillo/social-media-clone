import PostsFeed from "@/components/posts/PostsFeed";
import { fetchOnePostAction } from "@/lib/actions/posts-actions";

export default async function postPage({ params }) {
	const { id } = await params;
	const { post, error } = await fetchOnePostAction(id);
	if (error || !post) return <div className="p-3">Post not found.</div>;

	return (
		<div className="overflow-y-auto w-full flex flex-col items-center pt-6 scrollbar-none">
			<PostsFeed posts={[post]} />
		</div>
	);
}
