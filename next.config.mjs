/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com", // GitHub avatars
			},
			// add others you plan to use later:
			// { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google
			// { protocol: 'https', hostname: 'res.cloudinary.com' },       // Cloudinary
			{ protocol: "https", hostname: "api.dicebear.com" },
			{ protocol: "https", hostname: "www.gravatar.com" },
			{ protocol: "https", hostname: "secure.gravatar.com" },
			{ protocol: "https", hostname: "**.supabase.co" }, // for Supabase Storage buckets
			{ protocol: "https", hostname: "picsum.photos" },
		],
	},
};

export default nextConfig;
