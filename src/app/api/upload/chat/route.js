import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE; // NEVER expose client-side
const BUCKET = process.env.SUPABASE_BUCKET || "posts";

const supabase = createClient(url, serviceKey);

export async function POST(req) {
	const session = await auth();
	// gate: require a real user (block guests if you want)
	if (!session?.user || session.user.role === "GUEST") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const form = await req.formData();
	const file = form.get("file");
	if (!(file instanceof File)) {
		return NextResponse.json({ error: "No file" }, { status: 400 });
	}

	const ext = file.name.split(".").pop() || "jpg";
	const path = `chat/${Date.now()}-${crypto.randomUUID()}.${ext}`;

	const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type || "image/jpeg",
	});

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
	return NextResponse.json({ url: pub.publicUrl });
}
