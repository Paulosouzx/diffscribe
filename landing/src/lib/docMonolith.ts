const SCENE_W = 1280;
const SCENE_H = 800;

type Point = { x: number; y: number };

type Crow = {
	born: number;
	x0: number;
	y0: number;
	dir: 1 | -1;
	speed: number;
	size: number;
	alpha: number;
	flapRate: number;
	phase: number;
	bob: number;
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
	sky.addColorStop(0, "#0c1628");
	sky.addColorStop(0.28, "#13243f");
	sky.addColorStop(0.46, "#1a3052");
	sky.addColorStop(0.62, "#162a48");
	sky.addColorStop(0.8, "#0e1a2f");
	sky.addColorStop(1, "#080e1a");
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, SCENE_W, SCENE_H);

	const glow = ctx.createRadialGradient(660, 280, 40, 660, 280, 620);
	glow.addColorStop(0, "rgba(120, 160, 220, 0.24)");
	glow.addColorStop(1, "rgba(120, 160, 220, 0)");
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
				"rgba(74, 104, 152, 0.42)",
				"rgba(84, 116, 168, 0.28)",
			);
		}
	});

	const horizon = ctx.createLinearGradient(0, 400, 0, 600);
	horizon.addColorStop(0, "rgba(96, 132, 190, 0)");
	horizon.addColorStop(0.55, "rgba(84, 120, 178, 0.32)");
	horizon.addColorStop(1, "rgba(52, 82, 134, 0.25)");
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
				"rgba(30, 48, 82, 0.72)",
				"rgba(36, 58, 98, 0.3)",
			);
		}
	});

	const midFog = ctx.createLinearGradient(0, 500, 0, 700);
	midFog.addColorStop(0, "rgba(40, 62, 102, 0)");
	midFog.addColorStop(1, "rgba(22, 38, 68, 0.5)");
	ctx.fillStyle = midFog;
	ctx.fillRect(0, 500, SCENE_W, 200);

	treeLayer(ctx, 0.5, (layer) => {
		drawTree(layer, rng, 70, 800, 520, "rgba(12, 22, 42, 0.88)", "rgba(20, 34, 62, 0.3)");
		drawTree(layer, rng, 1210, 800, 500, "rgba(12, 22, 42, 0.88)", "rgba(20, 34, 62, 0.3)");
	});

	const ground = ctx.createLinearGradient(0, 580, 0, SCENE_H);
	ground.addColorStop(0, "rgba(10, 18, 34, 0)");
	ground.addColorStop(0.55, "rgba(8, 14, 28, 0.7)");
	ground.addColorStop(1, "rgba(6, 10, 20, 0.95)");
	ctx.fillStyle = ground;
	ctx.fillRect(0, 580, SCENE_W, 220);

	const pattern = grainPattern(ctx);
	if (pattern) {
		ctx.fillStyle = pattern;
		ctx.fillRect(0, 0, SCENE_W, SCENE_H);
	}
}

function paintStone(ctx: CanvasRenderingContext2D) {
	const rng = mulberry32(99);

	ctx.save();
	quad(ctx, FACE);
	ctx.clip();
	const body = ctx.createLinearGradient(0, 150, 0, 840);
	body.addColorStop(0, "#0a1224");
	body.addColorStop(0.35, "#0f1a31");
	body.addColorStop(0.7, "#1a2a46");
	body.addColorStop(1, "#3a4e70");
	ctx.fillStyle = body;
	ctx.fillRect(500, 140, 240, 720);

	const sheen = ctx.createLinearGradient(520, 0, 719, 0);
	sheen.addColorStop(0, "rgba(255, 255, 255, 0.06)");
	sheen.addColorStop(0.3, "rgba(255, 255, 255, 0)");
	sheen.addColorStop(0.85, "rgba(2, 6, 16, 0.2)");
	sheen.addColorStop(1, "rgba(255, 255, 255, 0.05)");
	ctx.fillStyle = sheen;
	ctx.fillRect(500, 140, 240, 720);

	for (let i = 0; i < 2400; i++) {
		const x = 517 + rng() * 202;
		const y = 150 + rng() * 690;
		const r = 0.25 + rng() * 0.7;
		ctx.fillStyle =
			rng() < 0.55 ? "rgba(2, 6, 14, 0.28)" : "rgba(160, 186, 226, 0.07)";
		ctx.fillRect(x, y, r, r);
	}

	const base = ctx.createLinearGradient(0, 560, 0, 840);
	base.addColorStop(0, "rgba(90, 120, 170, 0)");
	base.addColorStop(1, "rgba(90, 120, 170, 0.18)");
	ctx.fillStyle = base;
	ctx.fillRect(500, 560, 240, 280);
	ctx.restore();

	ctx.save();
	quad(ctx, SIDE);
	ctx.clip();
	const side = ctx.createLinearGradient(716, 0, 747, 0);
	side.addColorStop(0, "#26364f");
	side.addColorStop(0.5, "#45597a");
	side.addColorStop(1, "#324462");
	ctx.fillStyle = side;
	ctx.fillRect(700, 160, 60, 700);
	for (let i = 0; i < 900; i++) {
		const y = 190 + rng() * 650;
		const x = 716 + rng() * 32;
		const r = 0.3 + rng() * 0.9;
		ctx.fillStyle =
			rng() < 0.5 ? "rgba(10, 18, 34, 0.35)" : "rgba(170, 196, 232, 0.16)";
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
	const shade = ctx.createLinearGradient(0, 174, 0, 840);
	shade.addColorStop(0, "rgba(6, 12, 24, 0.2)");
	shade.addColorStop(1, "rgba(6, 12, 24, 0)");
	ctx.fillStyle = shade;
	ctx.fillRect(700, 160, 60, 700);
	ctx.restore();

	const rim = ctx.createLinearGradient(0, 150, 0, 620);
	rim.addColorStop(0, "rgba(170, 198, 240, 0.32)");
	rim.addColorStop(1, "rgba(170, 198, 240, 0)");
	ctx.strokeStyle = rim;
	ctx.lineWidth = 1.2;
	ctx.beginPath();
	ctx.moveTo(FACE[3].x, 620);
	ctx.lineTo(FACE[0].x, FACE[0].y);
	ctx.lineTo(FACE[1].x, FACE[1].y);
	ctx.lineTo(SIDE[1].x, SIDE[1].y);
	ctx.stroke();
}

function paintSurface(ctx: CanvasRenderingContext2D, t: number) {
	ctx.save();
	quad(ctx, FACE);
	ctx.clip();
	const sweepY = 150 + ((t * 22) % 980) - 160;
	const sweep = ctx.createLinearGradient(0, sweepY - 140, 0, sweepY + 140);
	sweep.addColorStop(0, "rgba(180, 206, 246, 0)");
	sweep.addColorStop(0.5, "rgba(180, 206, 246, 0.045)");
	sweep.addColorStop(1, "rgba(180, 206, 246, 0)");
	ctx.fillStyle = sweep;
	ctx.fillRect(500, sweepY - 140, 240, 280);
	ctx.restore();
}

function spawnFlock(t: number): Crow[] {
	const dir: 1 | -1 = Math.random() < 0.7 ? 1 : -1;
	const count = 1 + Math.floor(Math.random() * 5);
	const y = 90 + Math.random() * 230;
	const speed = 150 + Math.random() * 90;
	const depth = 0.6 + Math.random() * 0.4;
	const flock: Crow[] = [];
	for (let i = 0; i < count; i++) {
		flock.push({
			born: t,
			x0: (dir === 1 ? -30 : SCENE_W + 30) - dir * (i * (14 + Math.random() * 26)),
			y0: y + (Math.random() - 0.5) * 50,
			dir,
			speed: speed * (0.94 + Math.random() * 0.12),
			size: (4.2 + Math.random() * 2.2) * depth,
			alpha: 0.72 + depth * 0.28,
			flapRate: 9 + Math.random() * 4,
			phase: Math.random() * Math.PI * 2,
			bob: Math.random() * Math.PI * 2,
		});
	}
	return flock;
}

function paintCrows(ctx: CanvasRenderingContext2D, crows: Crow[], t: number) {
	for (const c of crows) {
		const age = t - c.born;
		const x = c.x0 + c.dir * c.speed * age;
		const y = c.y0 + Math.sin(age * 1.3 + c.bob) * 4;
		const gliding = Math.sin(age * 0.9 + c.bob) > 0.55;
		const wing = gliding ? 0.18 : Math.sin(age * c.flapRate + c.phase);
		const s = c.size;
		const tipY = -wing * s * 0.75;
		const bend = -wing * s * 0.2 - s * 0.12;

		ctx.save();
		ctx.translate(x, y);
		ctx.scale(c.dir, 1);
		ctx.fillStyle = `rgba(2, 4, 9, ${c.alpha})`;
		ctx.strokeStyle = `rgba(2, 4, 9, ${c.alpha})`;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		ctx.beginPath();
		ctx.ellipse(0, 0, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(-s * 0.35, 0);
		ctx.lineTo(-s * 0.62, -s * 0.06);
		ctx.lineTo(-s * 0.62, s * 0.08);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.arc(s * 0.42, -s * 0.04, s * 0.11, 0, Math.PI * 2);
		ctx.fill();

		ctx.lineWidth = s * 0.2;
		ctx.beginPath();
		ctx.moveTo(-s * 0.95, tipY);
		ctx.quadraticCurveTo(-s * 0.45, bend, 0, 0);
		ctx.quadraticCurveTo(s * 0.45, bend, s * 0.95, tipY);
		ctx.stroke();
		ctx.restore();
	}
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
		g.addColorStop(0, `rgba(110, 142, 192, ${alpha})`);
		g.addColorStop(1, "rgba(110, 142, 192, 0)");
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
		g.addColorStop(0, `rgba(92, 126, 182, ${alpha})`);
		g.addColorStop(1, "rgba(92, 126, 182, 0)");
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

	const backdrop = document.createElement("canvas");
	const stone = document.createElement("canvas");
	let crows: Crow[] = [];
	let nextFlock = 1.2;
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
		for (const layer of [backdrop, stone]) {
			layer.width = canvas.width;
			layer.height = canvas.height;
		}
		const bctx = backdrop.getContext("2d");
		const sctx = stone.getContext("2d");
		if (bctx) {
			bctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
			paintStatic(bctx);
		}
		if (sctx) {
			sctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
			paintStone(sctx);
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

		const base = ctx.getTransform();
		if (options.animate) {
			if (t >= nextFlock) {
				crows = crows.concat(spawnFlock(t));
				nextFlock = t + 5 + Math.random() * 9;
			}
			crows = crows.filter((c) => {
				const x = c.x0 + c.dir * c.speed * (t - c.born);
				return x > -260 && x < SCENE_W + 260;
			});
			ctx.transform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
			paintCrows(ctx, crows, t);
			ctx.setTransform(base);
		}

		ctx.drawImage(stone, 0, 0);
		ctx.transform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
		paintSurface(ctx, t);
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
