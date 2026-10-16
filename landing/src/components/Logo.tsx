type Props = {
	className?: string;
	animated?: boolean;
};

const stroke = {
	stroke: "#fff",
	strokeWidth: 3,
	strokeLinecap: "round",
	fill: "none",
} as const;

export function Logo({ className = "logo__icon", animated = true }: Props) {
	const c = (name: string) => (animated ? name : undefined);
	return (
		<svg
			className={className}
			viewBox="0 0 146 30"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path className={c("logo__stem-a")} pathLength={100} {...stroke} d="M14.3 6.4V1.5" />
			<path className={c("logo__stem-b")} pathLength={100} {...stroke} d="M14.3 23.4V28.5" />
			<circle
				className={c("logo__circle")}
				cx="14.3"
				cy="14.9"
				r="7"
				fill="none"
				stroke="#fff"
				strokeWidth="3"
			/>
			<path
				className={c("logo__arc-1a")}
				pathLength={100}
				{...stroke}
				d="M27.3 14.9A13 13 0 0 0 21.19 3.88"
			/>
			<path
				className={c("logo__arc-1b")}
				pathLength={100}
				{...stroke}
				d="M27.3 14.9A13 13 0 0 1 21.19 25.92"
			/>
			<path
				className={c("logo__arc-2a")}
				pathLength={100}
				{...stroke}
				d="M34.3 14.9A20 20 0 0 0 29.16 1.52"
			/>
			<path
				className={c("logo__arc-2b")}
				pathLength={100}
				{...stroke}
				d="M34.3 14.9A20 20 0 0 1 29.16 28.28"
			/>
			<g className={c("logo__text-group")}>
				<text
					x="44"
					y="22"
					fontFamily="Inter Tight"
					fontSize="22"
					fontWeight="700"
					fill="#fff"
					letterSpacing="-0.5"
				>
					Diffscribe
				</text>
			</g>
		</svg>
	);
}
