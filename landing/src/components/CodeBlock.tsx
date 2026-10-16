import { useEffect, useRef, useState } from "react";

type Props = {
	code: string;
	label?: string;
	lang?: "bash" | "json" | "text";
	copy?: boolean;
};

async function writeClipboard(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}
	const area = document.createElement("textarea");
	area.value = text;
	area.setAttribute("readonly", "");
	area.style.position = "fixed";
	area.style.opacity = "0";
	document.body.appendChild(area);
	area.select();
	document.execCommand("copy");
	area.remove();
}

export function CodeBlock({ code, label, lang = "bash", copy = true }: Props) {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	const onCopy = async () => {
		try {
			await writeClipboard(code);
			setCopied(true);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => setCopied(false), 1600);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className={`code code--${lang}`}>
			{(label || copy) && (
				<div className="code__bar">
					<span className="code__label">{label ?? lang}</span>
					{copy && (
						<button
							type="button"
							className="code__copy"
							onClick={onCopy}
							aria-label={copied ? "Copied" : `Copy ${label ?? "code"}`}
						>
							{copied ? "Copied" : "Copy"}
						</button>
					)}
				</div>
			)}
			<pre className="code__pre">
				<code>{code}</code>
			</pre>
			<span className="sr-only" aria-live="polite">
				{copied ? "Copied to clipboard" : ""}
			</span>
		</div>
	);
}
