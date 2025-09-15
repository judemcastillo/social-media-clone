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
		],
	},
};

export default nextConfig;
