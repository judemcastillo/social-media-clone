import React from "react";

// A small, tailwind-friendly spinner component.
export function Spinner({ size = 20, className = "", label = "Loading" }) {
	const px = typeof size === "number" ? `${size}px` : size;
	return (
		<div
			role="status"
			aria-live="polite"
			className={`inline-flex items-center justify-center ${className}`}
		>
			<svg
				className="animate-spin"
				width={px}
				height={px}
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
				/>
			</svg>
			<span className="sr-only">{label}</span>
		</div>
	);
}

export default Spinner;
