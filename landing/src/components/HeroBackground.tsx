import { useEffect, useRef } from "react";
import { mountDocMonolith } from "../lib/docMonolith";

export const HERO_VIDEO_SRC: string | null = null;

type Props = {
	onReady: () => void;
};

export function HeroBackground({ onReady }: Props) {
	if (HERO_VIDEO_SRC) {
		return <VideoBackground src={HERO_VIDEO_SRC} onReady={onReady} />;
	}
	return <CanvasBackground onReady={onReady} />;
}

function CanvasBackground({ onReady }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const readyRef = useRef(onReady);
	readyRef.current = onReady;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		return mountDocMonolith(canvas, {
			animate: !reduced,
			onReady: () => readyRef.current(),
		});
	}, []);

	return <canvas className="hero__canvas" ref={canvasRef} aria-hidden="true" />;
}

function VideoBackground({
	src,
	onReady,
}: {
	src: string;
	onReady: () => void;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const readyRef = useRef(onReady);
	readyRef.current = onReady;

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		const onCanPlayThrough = () => readyRef.current();
		const onTimeUpdate = () => {
			if (video.currentTime >= 10) {
				video.currentTime = 0;
				video.play().catch(() => {});
			}
		};
		video.play().catch(() => {});
		if (video.readyState >= 4) {
			readyRef.current();
		} else {
			video.addEventListener("canplaythrough", onCanPlayThrough, { once: true });
		}
		video.addEventListener("timeupdate", onTimeUpdate);
		return () => {
			video.removeEventListener("canplaythrough", onCanPlayThrough);
			video.removeEventListener("timeupdate", onTimeUpdate);
		};
	}, []);

	return (
		<video
			className="hero__video"
			ref={videoRef}
			autoPlay
			muted
			loop
			playsInline
			preload="auto"
		>
			<source src={src} type="video/mp4" />
		</video>
	);
}
