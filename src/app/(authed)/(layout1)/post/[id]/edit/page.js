import EditPost from "@/components/posts/EditPost";
import { fetchOnePost } from "@/lib/helpers/fetch";

export const dynamic = "force-dynamic";

export default async function editPost({ params }) {
	const { id } = await params;

	return (
		<>
			<EditPost postId={id} />
		</>
	);
}
