import EditPost from "@/components/posts/EditPost";


export const dynamic = "force-dynamic";

export default async function editPost({ params }) {
	const { id } = await params;

	return (
		<>
			<EditPost postId={id} />
		</>
	);
}
