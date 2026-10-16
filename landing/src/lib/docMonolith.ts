const SCENE_W = 1280;
const SCENE_H = 800;
const ROW_H = 11;
const ROW_COUNT = 132;
const RISE_SPEED = 7;

type Point = { x: number; y: number };

type DiffRow = {
	kind: "add" | "del" | "ctx" | "file" | "gap";
	indent: number;
	width: number;
	second: number;
};

type Options = {
	animate: boolean;
	onReady: () => void;
};

const FACE: [Point, Point, Point, Point] = [
	{ x: 520, y: 150 },
	{ x: 716, y: 174 },
	{ x: 719, y: 840 },
	{ x: 517, y: 840 },
];

const SIDE: [Point, Point, Point, Point] = [
	{ x: 716, y: 174 },
	{ x: 743, y: 191 },
	{ x: 747, y: 840 },
	{ x: 719, y: 840 },
];

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function quad(ctx: CanvasRenderingContext2D, q: readonly Point[]) {
	ctx.beginPath();
	q.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
	ctx.closePath();
}

function curve(
	ctx: CanvasRenderingContext2D,
	rng: () => number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	width: number,
) {
	const mx = (x1 + x2) / 2 + (rng() - 0.5) * Math.abs(y2 - y1) * 0.25;
	const my = (y1 + y2) / 2 + (rng() - 0.5) * Math.abs(x2 - x1) * 0.15;
	ctx.lineWidth = Math.max(width, 0.4);
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.quadraticCurveTo(mx, my, x2, y2);
	ctx.stroke();
}

function drawTwigs(
	ctx: CanvasRenderingContext2D,
	rng: () => number,
	x: number,
	y: number,
	size: number,
	count: number,
) {
	for (let i = 0; i < count; i++) {
		const a = -Math.PI / 2 + (rng() - 0.5) * 2.9;
		const l = size * (0.35 + rng() * 0.65);
		const ex = x + Math.cos(a) * l;
		const ey = y + Math.sin(a) * l * 0.42;
		curve(ctx, rng, x, y, ex, ey, 0.6);
		const forks = 1 + Math.floor(rng() * 3);
		for (let j = 0; j < forks; j++) {
			const b = a + (rng() - 0.5) * 1.6;
			const bl = l * (0.3 + rng() * 0.4);
			curve(ctx, rng, ex, ey, ex + Math.cos(b) * bl, ey + Math.sin(b) * bl * 0.35, 0.4);
		}
	}
}

function drawTree(
	ctx: CanvasRenderingContext2D,
	rng: () => number,
	x: number,
	baseY: number,
	height: number,
	color: string,
	haze: string,
) {
	ctx.strokeStyle = color;
	ctx.lineCap = "round";
	const crownY = baseY - height;
	const crownW = height * (0.55 + rng() * 0.35);
	const forkX = x + (rng() - 0.5) * height * 0.12;
	const forkY = baseY - height * (0.38 + rng() * 0.12);

	for (let i = 0; i < 5; i++) {
		const hx = x + (rng() - 0.5) * crownW * 1.2;
		const hy = crownY + height * 0.05 + rng() * height * 0.08;
		const rx = crownW * (0.3 + rng() * 0.3);
		const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, rx);
		g.addColorStop(0, haze);
		g.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctx.save();
		ctx.translate(hx, hy);
		ctx.scale(1, 0.28);
		ctx.translate(-hx, -hy);
		ctx.fillStyle = g;
		ctx.fillRect(hx - rx, hy - rx, rx * 2, rx * 2);
		ctx.restore();
	}

	curve(ctx, rng, x, baseY, forkX, forkY, height * 0.028);

	const limbs = 3 + Math.floor(rng() * 3);
	for (let i = 0; i < limbs; i++) {
		const t = limbs === 1 ? 0.5 : i / (limbs - 1);
		const tx = x + (t - 0.5) * crownW * 1.5 + (rng() - 0.5) * crownW * 0.25;
		const ty = crownY + rng() * height * 0.16;
		const midX = forkX + (tx - forkX) * 0.45;
		const midY = forkY + (ty - forkY) * 0.55;
		curve(ctx, rng, forkX, forkY, midX, midY, height * 0.016);
		curve(ctx, rng, midX, midY, tx, ty, height * 0.009);
		if (rng() < 0.7) {
			const sx = midX + (tx - midX) * 0.3 + (rng() - 0.5) * crownW * 0.5;
			const sy = ty + rng() * height * 0.08;
			curve(ctx, rng, midX, midY, sx, sy, height * 0.006);
			drawTwigs(ctx, rng, sx, sy, height * 0.13, 5);
		}
		drawTwigs(ctx, rng, tx, ty, height * 0.18, 9 + Math.floor(rng() * 6));
	}
}

function grainPattern(ctx: CanvasRenderingContext2D) {
	const tile = document.createElement("canvas");
	tile.width = 128;
	tile.height = 128;
	const tctx = tile.getContext("2d");
	if (!tctx) return null;
	const img = tctx.createImageData(128, 128);
	const rng = mulberry32(7);
	for (let i = 0; i < img.data.length; i += 4) {
		const v = Math.floor(rng() * 255);
		img.data[i] = v;
		img.data[i + 1] = v;
		img.data[i + 2] = v;
		img.data[i + 3] = 14;
	}
	tctx.putImageData(img, 0, 0);
	return ctx.createPattern(tile, "repeat");
}

function treeLayer(
	ctx: CanvasRenderingContext2D,
	blur: number,
	draw: (layer: CanvasRenderingContext2D) => void,
) {
	const layer = document.createElement("canvas");
	layer.width = ctx.canvas.width;
	layer.height = ctx.canvas.height;
	const lctx = layer.getContext("2d");
	if (!lctx) return;
	lctx.setTransform(ctx.getTransform());
	draw(lctx);
	const scale = ctx.getTransform().a;
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.filter = `blur(${(blur * scale).toFixed(2)}px)`;
	ctx.drawImage(layer, 0, 0);
	ctx.restore();
}

function paintStatic(ctx: CanvasRenderingContext2D) {
	const sky = ctx.createLinearGradient(0, 0, 0, SCENE_H);
	sky.addColorStop(0, "#cfb3d6");
	sky.addColorStop(0.28, "#dac4df");
	sky.addColorStop(0.46, "#ccb2d2");
	sky.addColorStop(0.62, "#a68dae");
	sky.addColorStop(0.8, "#5b4b63");
	sky.addColorStop(1, "#2a2230");
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, SCENE_W, SCENE_H);

	const glow = ctx.createRadialGradient(660, 280, 40, 660, 280, 620);
	glow.addColorStop(0, "rgba(238, 230, 244, 0.4)");
	glow.addColorStop(1, "rgba(238, 230, 244, 0)");
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, SCENE_W, SCENE_H);

	const rng = mulberry32(2025);
	treeLayer(ctx, 2.2, (layer) => {
		for (let i = 0; i < 22; i++) {
			const x = -40 + (i / 21) * 1360 + (rng() - 0.5) * 50;
			drawTree(
				layer,
				rng,
				x,
				560 + rng() * 20,
				110 + rng() * 60,
				"rgba(140, 116, 152, 0.42)",
				"rgba(150, 120, 164, 0.3)",
			);
		}
	});

	const horizon = ctx.createLinearGradient(0, 400, 0, 600);
	horizon.addColorStop(0, "rgba(212, 198, 220, 0)");
	horizon.addColorStop(0.55, "rgba(200, 184, 210, 0.42)");
	horizon.addColorStop(1, "rgba(160, 138, 172, 0.25)");
	ctx.fillStyle = horizon;
	ctx.fillRect(0, 400, SCENE_W, 200);

	treeLayer(ctx, 1.3, (layer) => {
		const spots = [90, 330, 450, 880, 1010, 1180];
		for (const sx of spots) {
			drawTree(
				layer,
				rng,
				sx + (rng() - 0.5) * 60,
				660 + rng() * 20,
				210 + rng() * 70,
				"rgba(104, 80, 118, 0.6)",
				"rgba(116, 88, 132, 0.3)",
			);
		}
	});

	const midFog = ctx.createLinearGradient(0, 500, 0, 700);
	midFog.addColorStop(0, "rgba(150, 128, 162, 0)");
	midFog.addColorStop(1, "rgba(112, 92, 124, 0.5)");
	ctx.fillStyle = midFog;
	ctx.fillRect(0, 500, SCENE_W, 200);

	treeLayer(ctx, 0.5, (layer) => {
		drawTree(layer, rng, 70, 800, 520, "rgba(76, 58, 88, 0.82)", "rgba(88, 64, 104, 0.3)");
		drawTree(layer, rng, 1210, 800, 500, "rgba(76, 58, 88, 0.82)", "rgba(88, 64, 104, 0.3)");
	});

	const ground = ctx.createLinearGradient(0, 580, 0, SCENE_H);
	ground.addColorStop(0, "rgba(64, 50, 74, 0)");
	ground.addColorStop(0.55, "rgba(52, 40, 60, 0.7)");
	ground.addColorStop(1, "rgba(32, 26, 36, 0.95)");
	ctx.fillStyle = ground;
	ctx.fillRect(0, 580, SCENE_W, 220);

	const pattern = grainPattern(ctx);
	if (pattern) {
		ctx.fillStyle = pattern;
		ctx.fillRect(0, 0, SCENE_W, SCENE_H);
	}
}

function paintSideTexture(ctx: CanvasRenderingContext2D) {
	const rng = mulberry32(99);
	ctx.save();
	quad(ctx, SIDE);
	ctx.clip();
	const side = ctx.createLinearGradient(716, 0, 747, 0);
	side.addColorStop(0, "#77708a");
	side.addColorStop(0.5, "#a49cae");
	side.addColorStop(1, "#8a8296");
	ctx.fillStyle = side;
	ctx.fillRect(700, 160, 60, 700);
	for (let i = 0; i < 900; i++) {
		const y = 190 + rng() * 650;
		const x = 716 + rng() * 32;
		const r = 0.3 + rng() * 0.9;
		ctx.fillStyle =
			rng() < 0.5 ? "rgba(70, 64, 82, 0.35)" : "rgba(214, 206, 220, 0.2)";
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
	const shade = ctx.createLinearGradient(0, 174, 0, 840);
	shade.addColorStop(0, "rgba(40, 36, 52, 0.15)");
	shade.addColorStop(1, "rgba(40, 36, 52, 0)");
	ctx.fillStyle = shade;
	ctx.fillRect(700, 160, 60, 700);
	ctx.restore();
}

function buildRows(): DiffRow[] {
	const rng = mulberry32(42);
	const rows: DiffRow[] = [];
	for (let i = 0; i < ROW_COUNT; i++) {
		const r = rng();
		let kind: DiffRow["kind"];
		if (i % 22 === 0) kind = "file";
		else if (i % 22 === 21 || r < 0.06) kind = "gap";
		else if (r < 0.34) kind = "add";
		else if (r < 0.52) kind = "del";
		else kind = "ctx";
		rows.push({
			kind,
			indent: kind === "file" ? 0 : Math.floor(rng() * 3) * 10,
			width: kind === "file" ? 70 + rng() * 40 : 26 + rng() * 104,
			second: rng() < 0.35 ? 12 + rng() * 34 : 0,
		});
	}
	return rows;
}

function paintFace(ctx: CanvasRenderingContext2D, rows: DiffRow[], t: number) {
	const tl = FACE[0];
	const tr = FACE[1];
	const slope = (tr.y - tl.y) / (tr.x - tl.x);
	const faceW = tr.x - tl.x;

	ctx.save();
	quad(ctx, FACE);
	ctx.clip();

	const body = ctx.createLinearGradient(0, 150, 0, 840);
	body.addColorStop(0, "#2d2942");
	body.addColorStop(0.35, "#36314d");
	body.addColorStop(0.7, "#4c4560");
	body.addColorStop(1, "#7d7385");
	ctx.fillStyle = body;
	ctx.fillRect(500, 140, 240, 720);

	const sheen = ctx.createLinearGradient(520, 0, 719, 0);
	sheen.addColorStop(0, "rgba(255, 255, 255, 0.05)");
	sheen.addColorStop(0.35, "rgba(255, 255, 255, 0)");
	sheen.addColorStop(0.85, "rgba(10, 8, 20, 0.12)");
	sheen.addColorStop(1, "rgba(255, 255, 255, 0.06)");
	ctx.fillStyle = sheen;
	ctx.fillRect(500, 140, 240, 720);

	ctx.translate(tl.x, tl.y);
	ctx.transform(1, slope, 0, 1, 0, 0);

	const margin = 18;
	ctx.fillStyle = "rgba(226, 218, 238, 0.22)";
	ctx.fillRect(margin, 24, 96, 5);
	ctx.fillStyle = "rgba(226, 218, 238, 0.1)";
	ctx.fillRect(margin, 38, 62, 3);
	ctx.fillRect(margin, 47, 84, 3);
	ctx.fillRect(margin, 56, 54, 3);

	const top = 76;
	const bottom = 690;
	const total = ROW_COUNT * ROW_H;
	const offset = (t * RISE_SPEED) % total;

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (!row || row.kind === "gap") continue;
		let y = top + i * ROW_H - offset;
		if (y < top - ROW_H) y += total;
		if (y > bottom) continue;

		const fadeIn = Math.min(1, Math.max(0, (y - top) / 46));
		const fadeOut = Math.min(1, Math.max(0, (bottom - y) / 240));
		const a = fadeIn * fadeOut;
		if (a <= 0.01) continue;

		const x = margin + 10 + row.indent;
		const maxW = faceW - x - margin;
		const w = Math.min(row.width, maxW);

		if (row.kind === "file") {
			ctx.fillStyle = `rgba(232, 226, 242, ${0.26 * a})`;
			ctx.fillRect(margin, y, 3, 3);
			ctx.fillRect(margin + 8, y, w, 3.2);
			continue;
		}

		let color = `rgba(214, 206, 230, ${0.12 * a})`;
		if (row.kind === "add") color = `rgba(168, 196, 182, ${0.34 * a})`;
		if (row.kind === "del") color = `rgba(206, 168, 184, ${0.3 * a})`;
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.1;

		if (row.kind !== "ctx") {
			ctx.beginPath();
			ctx.moveTo(margin, y + 1.5);
			ctx.lineTo(margin + 5, y + 1.5);
			if (row.kind === "add") {
				ctx.moveTo(margin + 2.5, y - 1);
				ctx.lineTo(margin + 2.5, y + 4);
			}
			ctx.stroke();
		}

		ctx.fillRect(x, y, w, 3);
		if (row.second > 0 && x + w + 5 + row.second < faceW - margin) {
			ctx.fillRect(x + w + 5, y, row.second, 3);
		}
	}

	ctx.restore();

	ctx.save();
	quad(ctx, FACE);
	ctx.clip();
	const sweepY = 150 + ((t * 26) % 980) - 160;
	const sweep = ctx.createLinearGradient(0, sweepY - 120, 0, sweepY + 120);
	sweep.addColorStop(0, "rgba(240, 232, 250, 0)");
	sweep.addColorStop(0.5, "rgba(240, 232, 250, 0.05)");
	sweep.addColorStop(1, "rgba(240, 232, 250, 0)");
	ctx.fillStyle = sweep;
	ctx.fillRect(500, sweepY - 120, 240, 240);
	ctx.restore();
}

function paintMist(ctx: CanvasRenderingContext2D, t: number) {
	const blobs: [number, number, number, number, number][] = [
		[600, 720, 150, 0.32, 0],
		[700, 760, 170, 0.28, 1.7],
		[540, 790, 190, 0.26, 3.1],
		[660, 650, 110, 0.18, 4.4],
	];
	for (const [bx, by, r, alpha, phase] of blobs) {
		const x = bx + Math.sin(t * 0.09 + phase) * 26;
		const y = by + Math.cos(t * 0.07 + phase) * 12;
		const g = ctx.createRadialGradient(x, y, 0, x, y, r);
		g.addColorStop(0, `rgba(206, 196, 210, ${alpha})`);
		g.addColorStop(1, "rgba(206, 196, 210, 0)");
		ctx.fillStyle = g;
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
	}

	const drift: [number, number, number, number][] = [
		[0, 560, 420, 0.14],
		[700, 610, 520, 0.12],
	];
	for (const [ox, y, r, alpha] of drift) {
		const x = ((ox + t * 9) % (SCENE_W + r * 2)) - r;
		const g = ctx.createRadialGradient(x, y, 0, x, y, r);
		g.addColorStop(0, `rgba(196, 180, 206, ${alpha})`);
		g.addColorStop(1, "rgba(196, 180, 206, 0)");
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(1, 0.32);
		ctx.translate(-x, -y);
		ctx.fillStyle = g;
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
		ctx.restore();
	}
}

export function mountDocMonolith(canvas: HTMLCanvasElement, options: Options) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		options.onReady();
		return () => {};
	}

	const rows = buildRows();
	const backdrop = document.createElement("canvas");
	const side = document.createElement("canvas");
	let width = 0;
	let height = 0;
	let dpr = 1;
	let frame = 0;
	let lastPaint = 0;
	let visible = true;
	let ready = false;
	const start = performance.now();

	const cover = () => {
		const scale = Math.max(width / SCENE_W, height / SCENE_H);
		return {
			scale,
			ox: (width - SCENE_W * scale) / 2,
			oy: (height - SCENE_H * scale) / 2,
		};
	};

	const rebuild = () => {
		const rect = canvas.getBoundingClientRect();
		width = Math.max(1, Math.round(rect.width));
		height = Math.max(1, Math.round(rect.height));
		dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		const { scale, ox, oy } = cover();
		for (const layer of [backdrop, side]) {
			layer.width = canvas.width;
			layer.height = canvas.height;
		}
		const bctx = backdrop.getContext("2d");
		const sctx = side.getContext("2d");
		if (bctx) {
			bctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
			paintStatic(bctx);
		}
		if (sctx) {
			sctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
			paintSideTexture(sctx);
		}
	};

	const paint = (now: number) => {
		const t = options.animate ? (now - start) / 1000 : 18;
		const zoom = options.animate ? 1 + 0.018 * (0.5 - 0.5 * Math.cos(t / 9)) : 1;
		const { scale, ox, oy } = cover();

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.scale(zoom, zoom);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);
		ctx.drawImage(backdrop, 0, 0);
		ctx.drawImage(side, 0, 0);

		const base = ctx.getTransform();
		ctx.transform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
		paintFace(ctx, rows, t);
		ctx.setTransform(base);
		ctx.transform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
		paintMist(ctx, t);

		if (!ready) {
			ready = true;
			options.onReady();
		}
	};

	const loop = (now: number) => {
		frame = requestAnimationFrame(loop);
		if (!visible || document.hidden) return;
		if (now - lastPaint < 33) return;
		lastPaint = now;
		paint(now);
	};

	rebuild();
	if (options.animate) {
		frame = requestAnimationFrame(loop);
	} else {
		paint(performance.now());
	}

	let resizeTimer: ReturnType<typeof setTimeout> | undefined;
	const onResize = () => {
		if (resizeTimer) clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			rebuild();
			paint(performance.now());
		}, 120);
	};
	const resizeObserver = new ResizeObserver(onResize);
	resizeObserver.observe(canvas);

	const io = new IntersectionObserver((entries) => {
		visible = entries.some((e) => e.isIntersecting);
	});
	io.observe(canvas);

	return () => {
		cancelAnimationFrame(frame);
		if (resizeTimer) clearTimeout(resizeTimer);
		resizeObserver.disconnect();
		io.disconnect();
	};
}
