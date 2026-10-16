import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { HeroBackground } from "../components/HeroBackground";
import { Logo } from "../components/Logo";
import {
	AUTHOR_GITHUB,
	AUTHOR_SITE,
	CLI_COMMANDS,
	CLI_FLAGS,
	CLI_ONLINE,
	LOCAL_STEPS,
	MODES,
	ONLINE_STEPS,
	OUTPUT_EXCERPT,
	PARAMS,
	PRINCIPLES,
	REPO_URL,
	RETURN_JSON,
	SECTIONS,
	STEPS,
} from "../content";
import sampleDoc from "../sample-documentation.md?raw";

export const Route = createFileRoute("/")({
	component: Home,
});

const CHAR_STEP = 0.038;

type SectionId = (typeof SECTIONS)[number]["id"];

function Arrow() {
	return (
		<svg className="btn__arrow" viewBox="0 0 8 8" fill="none" aria-hidden="true">
			<path
				d="M1 7L7 1M7 1H2M7 1V6"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function PreviewLine({ line }: { line: string }) {
	const trimmed = line.trimStart();
	let cls = "preview__line";
	if (trimmed.startsWith("+")) cls += " preview__line--add";
	else if (trimmed.startsWith("-") && !trimmed.startsWith("- ")) cls += " preview__line--del";
	else if (trimmed.startsWith("@@")) cls += " preview__line--hunk";
	const parts = line.split("[To be filled by AI]");
	return (
		<span className={cls}>
			{parts.map((part, i) => (
				<Fragment key={`${i}-${part}`}>
					{part}
					{i < parts.length - 1 && (
						<mark className="preview__placeholder">[To be filled by AI]</mark>
					)}
				</Fragment>
			))}
			{"\n"}
		</span>
	);
}

function Home() {
	const heroRef = useRef<HTMLDivElement>(null);
	const startedRef = useRef(false);
	const [active, setActive] = useState<SectionId>("overview");
	const [menuOpen, setMenuOpen] = useState(false);
	const [installTab, setInstallTab] = useState<"online" | "local">("online");

	const startAnimations = useCallback(() => {
		const hero = heroRef.current;
		if (!hero || startedRef.current) return;
		startedRef.current = true;

		const animateLines = (selector: string, baseDelay: number, lineGap: number) => {
			hero.querySelectorAll<HTMLElement>(selector).forEach((inner, lineIndex) => {
				if (inner.dataset.split === "true") return;
				inner.dataset.split = "true";
				const lineDelay = baseDelay + lineIndex * lineGap;
				let charCount = 0;
				const textNodes: Text[] = [];
				const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT);
				let node = walker.nextNode();
				while (node) {
					textNodes.push(node as Text);
					node = walker.nextNode();
				}
				textNodes.forEach((textNode) => {
					const text = textNode.textContent ?? "";
					const frag = document.createDocumentFragment();
					let word: HTMLSpanElement | null = null;
					for (const ch of text) {
						if (ch === " ") {
							frag.appendChild(document.createTextNode(" "));
							word = null;
							continue;
						}
						if (!word) {
							word = document.createElement("span");
							word.className = "hero__word";
							frag.appendChild(word);
						}
						const span = document.createElement("span");
						span.className = "hero__char";
						span.textContent = ch;
						span.style.animationDelay = `${(lineDelay + charCount * CHAR_STEP).toFixed(3)}s`;
						word.appendChild(span);
						charCount += 1;
					}
					textNode.parentNode?.replaceChild(frag, textNode);
				});
			});
		};

		document.body.classList.add("is-ready");
		animateLines(".hero__heading .hero__line-inner", 0.3, 0.85);
		animateLines(".hero__label .hero__line-inner", 0.3, 0.65);
		animateLines(".hero__desc .hero__line-inner", 0.3, 0.65);
	}, []);

	useEffect(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduced) startAnimations();
		const fallbackTimer = setTimeout(startAnimations, 5000);

		const onAnchorClick = (e: MouseEvent) => {
			const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
			if (!anchor) return;
			const href = anchor.getAttribute("href") ?? "";
			e.preventDefault();
			setMenuOpen(false);
			const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
			if (href === "#") {
				window.scrollTo({ top: 0, behavior });
				return;
			}
			const target = document.querySelector(href);
			if (target) {
				const top = target.getBoundingClientRect().top + window.scrollY;
				window.scrollTo({ top, behavior });
				history.replaceState(null, "", href);
			}
		};
		document.addEventListener("click", onAnchorClick);

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMenuOpen(false);
		};
		document.addEventListener("keydown", onKey);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setActive(entry.target.id as SectionId);
				}
			},
			{ rootMargin: "-45% 0px -50% 0px" },
		);
		for (const { id } of SECTIONS) {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		}

		return () => {
			clearTimeout(fallbackTimer);
			document.removeEventListener("click", onAnchorClick);
			document.removeEventListener("keydown", onKey);
			observer.disconnect();
			document.body.classList.remove("is-ready");
		};
	}, [startAnimations]);

	const onScrollDown = () => {
		const next = document.getElementById("how-it-works");
		const top = next ? next.getBoundingClientRect().top + window.scrollY : window.innerHeight;
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
	};

	const installSteps = installTab === "online" ? ONLINE_STEPS : LOCAL_STEPS;

	return (
		<>
			<div className="hero" id="overview" ref={heroRef}>
				<div className="hero__bg">
					<HeroBackground onReady={startAnimations} />
				</div>
				<div className="hero__overlay" />
				<div className="hero__gradient-top" />
				<div className="hero__gradient-bottom" />

				<div className="hero__blur">
					{Array.from({ length: 8 }, (_, i) => (
						<div className="hero__blur-layer" key={i} />
					))}
				</div>

				<header className="header">
					<a className="logo" href="#" aria-label="Diffscribe — back to top">
						<Logo />
					</a>

					<nav
						className={`nav-pill${menuOpen ? " nav-pill--open" : ""}`}
						id="primary-nav"
						aria-label="Primary"
					>
						<a className="nav-pill__link" href="#features">
							Features
						</a>
						<a className="nav-pill__link" href="#modes">
							Modes
							<span className="nav-pill__badge" aria-label="3 modes">
								3
							</span>
						</a>
						<a className="nav-pill__link" href="#install">
							Install
						</a>
						<a className="nav-pill__link" href="#reference">
							Reference
						</a>
					</nav>

					<button
						className="nav-menu"
						type="button"
						aria-expanded={menuOpen}
						aria-controls="primary-nav"
						onClick={() => setMenuOpen((open) => !open)}
					>
						<span>{menuOpen ? "Close" : "Menu"}</span>
						<span className={`nav-menu__icon${menuOpen ? " nav-menu__icon--open" : ""}`} />
					</button>

					<a className="btn btn--header" href={REPO_URL} target="_blank" rel="noreferrer">
						<span>
							<span className="btn__long">View on </span>GitHub
						</span>
						<Arrow />
					</a>
				</header>

				<h1 className="hero__heading">
					<span className="hero__line">
						<span className="hero__line-inner">Turn your Git diffs into</span>
					</span>
					<span className="hero__line">
						<span className="hero__line-inner">
							<em>documentation</em>
						</span>
					</span>
				</h1>

				<nav className="side-nav" aria-label="Sections">
					{SECTIONS.map(({ id, label }) => (
						<a
							key={id}
							className={`side-nav__link${active === id ? " side-nav__link--active" : ""}`}
							href={`#${id}`}
							aria-current={active === id ? "true" : undefined}
							onClick={() => setActive(id)}
						>
							<span className="side-nav__link-text">{label}</span>
							{active === id && <span className="side-nav__line" />}
						</a>
					))}
				</nav>

				<div className="hero__blur-bar" />

				<div className="hero__bottom">
					<div className="hero__label">
						<span className="hero__line-inner">01 — What it does</span>
					</div>
					<p className="hero__desc">
						<span className="hero__line-inner">An MCP server for Claude Code that turns your Git</span>{" "}
						<span className="hero__line-inner">changes into a structured Markdown skeleton —</span>{" "}
						<span className="hero__line-inner">ready for Claude to fill in the analysis.</span>
					</p>

					<div className="hero__actions">
						<a className="btn btn--footer" href="#install">
							Get started
							<Arrow />
						</a>

						<button className="scroll-down" id="scrollDown" type="button" onClick={onScrollDown}>
							<span className="scroll-down__text">Scroll down</span>
							<span className="scroll-down__circle">
								<svg viewBox="0 0 7.222 8.667" fill="none" aria-hidden="true">
									<path
										d="M3.611 1V7.667M3.611 7.667L1 5M3.611 7.667L6.222 5"
										stroke="currentColor"
										strokeWidth="1"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</span>
						</button>
					</div>

					<a className="about-card" href="#output">
						<div className="about-card__image about-card__preview" aria-hidden="true">
							<pre className="preview">
								{OUTPUT_EXCERPT.split("\n").map((line, i) => (
									<PreviewLine key={`${i}-${line}`} line={line} />
								))}
							</pre>
						</div>
						<div className="about-card__content">
							<div>
								<h3 className="about-card__title">Output preview</h3>
								<p className="about-card__text">
									A real documentation.md: diffs in, placeholders for Claude to fill.
								</p>
							</div>
							<svg className="about-card__arrow" viewBox="0 0 77 13" fill="none" aria-hidden="true">
								<path
									d="M1 6.5H75M75 6.5L70 1.5M75 6.5L70 11.5"
									stroke="currentColor"
									strokeWidth="1"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
					</a>
				</div>
			</div>

			<main>
				<section className="section" id="how-it-works" aria-labelledby="how-title">
					<div className="section__inner">
						<header className="section__head">
							<p className="section__label">02 — How it works</p>
							<h2 className="section__title" id="how-title">
								From one sentence to a <em>skeleton</em>
							</h2>
							<p className="section__lead">
								The server does the mechanical part — Git, filters, template, file. Claude Code does
								the understanding and the writing.
							</p>
						</header>

						<ol className="steps">
							{STEPS.map((step, i) => (
								<li className="step glass" key={step.title}>
									<span className="step__num">{String(i + 1).padStart(2, "0")}</span>
									<h3 className="step__title">{step.title}</h3>
									<p className="step__body">{step.body}</p>
									<CodeBlock code={step.code} lang={step.lang} copy={false} />
								</li>
							))}
						</ol>

						<div className="principles" id="features">
							<h3 className="principles__title">Design principles</h3>
							<div className="principles__grid">
								{PRINCIPLES.map((p) => (
									<article className="principle" key={p.title}>
										<h4 className="principle__title">{p.title}</h4>
										<p className="principle__body">{p.body}</p>
									</article>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="section" id="modes" aria-labelledby="modes-title">
					<div className="section__inner">
						<header className="section__head">
							<p className="section__label">03 — Modes</p>
							<h2 className="section__title" id="modes-title">
								Three ways to pick the <em>diff</em>
							</h2>
							<p className="section__lead">
								Only <code>mode</code> decides which Git command runs. Filtering, rendering and writing
								are identical for every mode.
							</p>
						</header>

						<div className="modes">
							{MODES.map((m) => (
								<article className="mode glass" key={m.id}>
									<div className="mode__top">
										<code className="mode__id">{m.id}</code>
										<span className="mode__tag">{m.tag}</span>
									</div>
									<h3 className="mode__title">{m.title}</h3>
									<p className="mode__body">{m.body}</p>
									<p className="mode__git">
										<code>{m.git}</code>
									</p>
									<blockquote className="mode__prompt">“{m.prompt}”</blockquote>
									<CodeBlock code={m.json} lang="json" label="tool arguments" />
									<p className="mode__note">{m.note}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section className="section" id="install" aria-labelledby="install-title">
					<div className="section__inner">
						<header className="section__head">
							<p className="section__label">04 — Install</p>
							<h2 className="section__title" id="install-title">
								Run it from GitHub or <em>locally</em>
							</h2>
							<p className="section__lead">
								Two ways to plug it into Claude Code. Online needs nothing but uv; local gives you the
								source to read and change.
							</p>
						</header>

						<div className="tabs glass" role="tablist" aria-label="Install method">
							<button
								type="button"
								role="tab"
								id="tab-online"
								aria-selected={installTab === "online"}
								aria-controls="install-panel"
								className={`tabs__tab${installTab === "online" ? " tabs__tab--active" : ""}`}
								onClick={() => setInstallTab("online")}
							>
								Online <span className="tabs__hint">· uvx, no clone</span>
							</button>
							<button
								type="button"
								role="tab"
								id="tab-local"
								aria-selected={installTab === "local"}
								aria-controls="install-panel"
								className={`tabs__tab${installTab === "local" ? " tabs__tab--active" : ""}`}
								onClick={() => setInstallTab("local")}
							>
								Local <span className="tabs__hint">· clone &amp; venv</span>
							</button>
						</div>

						<ol
							className="install"
							id="install-panel"
							role="tabpanel"
							aria-labelledby={installTab === "online" ? "tab-online" : "tab-local"}
						>
							{installSteps.map((step, i) => (
								<li className="install__step" key={`${installTab}-${step.title}`}>
									<span className="install__num">{i + 1}</span>
									<div className="install__body">
										<h3 className="install__title">{step.title}</h3>
										<p className="install__text">{step.body}</p>
										<CodeBlock code={step.code} label={step.label} />
									</div>
								</li>
							))}
						</ol>

						<p className="install__after">
							Then, inside any Git repository, ask Claude Code something like{" "}
							<em>“Document the last commit.”</em> The server writes <code>documentation.md</code> and
							Claude Code fills it in.
						</p>
					</div>
				</section>

				<section className="section" id="reference" aria-labelledby="reference-title">
					<div className="section__inner">
						<header className="section__head">
							<p className="section__label">05 — Reference</p>
							<h2 className="section__title" id="reference-title">
								The <em>generate_documentation</em> tool
							</h2>
							<p className="section__lead">
								Calling it with nothing but <code>project_path</code> documents the uncommitted changes.
							</p>
						</header>

						<div className="table-wrap glass">
							<table className="table">
								<thead>
									<tr>
										<th scope="col">Name</th>
										<th scope="col">Type</th>
										<th scope="col">Default</th>
										<th scope="col">Meaning</th>
									</tr>
								</thead>
								<tbody>
									{PARAMS.map(([name, type, def, meaning]) => (
										<tr key={name}>
											<td>
												<code>{name}</code>
											</td>
											<td>
												<code>{type}</code>
											</td>
											<td>
												<code>{def}</code>
											</td>
											<td>{meaning}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="reference__grid">
							<div>
								<h3 className="sub__title">Returns</h3>
								<CodeBlock code={RETURN_JSON} lang="json" label="result" />
								<p className="sub__text">
									On failure (<code>success: false</code>) an <code>error</code> field explains what
									went wrong: not a Git repo, unknown template, unwritable path.
								</p>
							</div>
							<div id="output">
								<h3 className="sub__title">Output</h3>
								<CodeBlock code={sampleDoc.trimEnd()} lang="text" label="documentation.md" />
								<p className="sub__text">
									Real output for one commit of this repo, filtered to <code>cli/*</code>. Every
									skeleton ends with an empty AI Usage section; the server never fills it in and no
									cost is calculated.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="section" id="cli" aria-labelledby="cli-title">
					<div className="section__inner">
						<header className="section__head">
							<p className="section__label">06 — CLI</p>
							<h2 className="section__title" id="cli-title">
								No Claude Code? Use the <em>CLI</em>
							</h2>
							<p className="section__lead">
								<code>gendoc-mcp</code> wraps the same core and prints the result as JSON. With no LLM in
								the loop, the placeholders and the AI Usage section stay empty.
							</p>
						</header>

						<div className="cli">
							<div className="cli__code">
								<CodeBlock code={CLI_COMMANDS} label="terminal" />
								<CodeBlock code={CLI_ONLINE} label="without installing · uvx" />
							</div>
							<dl className="flags glass">
								{CLI_FLAGS.map(([flag, meaning]) => (
									<div className="flags__row" key={flag}>
										<dt>
											<code>{flag}</code>
										</dt>
										<dd>{meaning}</dd>
									</div>
								))}
							</dl>
						</div>
					</div>
				</section>
			</main>

			<footer className="footer">
				<div className="footer__inner">
					<a className="footer__logo" href="#" aria-label="Diffscribe — back to top">
						<Logo className="footer__icon" animated={false} />
					</a>
					<p className="footer__text">
						Built by{" "}
						<a href={AUTHOR_SITE} target="_blank" rel="noreferrer">
							Paulo Souza
						</a>{" "}
						·{" "}
						<a href={AUTHOR_GITHUB} target="_blank" rel="noreferrer">
							@Paulosouzx
						</a>
					</p>
					<a className="btn btn--plain" href={REPO_URL} target="_blank" rel="noreferrer">
						Source on GitHub
						<Arrow />
					</a>
				</div>
			</footer>
		</>
	);
}
