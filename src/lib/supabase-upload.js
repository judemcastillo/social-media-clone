// src/lib/supabase-upload.js
"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "uploads";

const supabase = createClient(url, key);

export async function uploadToSupabase(file, { folder = "chat" } = {}) {
	const ext = file.name.split(".").pop() || "jpg";
	const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
	const { data, error } = await supabase.storage
		.from(BUCKET)
		.upload(path, file, {
			cacheControl: "3600",
			upsert: false,
		});
	if (error) throw error;
	const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
	return pub.publicUrl;
}
