function mulberry32(a) {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		var t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

class RingParticles {
	static get inputProperties() {
		return [
		'--ring-radius', '--ring-thickness',
		'--particle-count', '--particle-rows',
		'--particle-color', '--particle-size',
		'--animation-tick',
		'--particle-min-alpha', '--particle-max-alpha',
		'--ring-x', '--ring-y',
		'--fade-easing'
		];
	}

	/* --- BEZIER MATH --- */
	getBezierValue(t, p0, p1, p2, p3) {
		const u = 1 - t, tt = t * t, uu = u * u, uuu = uu * u, ttt = tt * t;
		return (uuu * p0) + (3 * uu * t * p1) + (3 * u * tt * p2) + (ttt * p3);
	}

	solveBezierX(targetX, x1, x2) {
		let t = targetX;
		for (let i = 0; i < 8; i++) {
		const currentX = this.getBezierValue(t, 0, x1, x2, 1);
		const slope = (this.getBezierValue(t + 0.001, 0, x1, x2, 1) - currentX) / 0.001;
		if (slope === 0) break;
		t -= (currentX - targetX) / slope;
		}
		return Math.max(0, Math.min(1, t));
	}

	parseEasing(str) {
		const s = str.trim();
		if (s === 'linear') return [0, 0, 1, 1];
		if (s === 'ease') return [0.25, 0.1, 0.25, 1];
		if (s === 'ease-in') return [0.42, 0, 1, 1];
		if (s === 'ease-out') return [0, 0, 0.58, 1];
		if (s === 'ease-in-out') return [0.42, 0, 0.58, 1];
		const m = s.match(/cubic-bezier\\(([^)]+)\\)/);
		return (m && m[1].split(',').length===4) ? m[1].split(',').map(Number) : [0.42, 0, 1, 1];
	}

	 parseProps(props) {
		return [
			'--ring-radius',
			'--ring-thickness',
			'--ring-x',
			'--ring-y',
			'--particle-count',
			'--particle-rows',
			'--particle-color',
			'--particle-size',
			'--particle-min-alpha',
			'--particle-max-alpha',
			'--fade-easing',
			'--animation-tick',
		].map((propName) => {
			const prop = props.get(propName);

			// Cater for browsers that don't speak CSS Typed OM and
			// for browsers that do speak it, but haven't registered the props
			if (
				typeof CSSUnparsedValue === 'undefined' ||
				prop instanceof CSSUnparsedValue
			) {
				if (!prop.length || prop === '') {
					return undefined;
				}

				switch (propName) {
					case '--ring-radius':
					case '--ring-thickness':
					case '--ring-x':
					case '--ring-y':
					case '--particle-size':
					case '--particle-min-alpha':
					case '--particle-max-alpha':
						return parseFloat(prop.toString());

					case '--particle-count':
					case '--particle-rows':
					case '--fade-easing':
					case '--animation-tick':
								return parseInt(prop.toString());

					case '--particle-color':
					default:
						return prop.toString().trim();
				}
			}

			// Prop is not typed using @property (UnparsedValue) and not set either
			// ~> Return undefined so that we can fall back to the default value during destructuring
			if (prop instanceof CSSUnparsedValue && !prop.length) {
				return undefined;
			}

			// Prop is a UnitValue (Number, Percentage, Integer, …)
			// ~> Return the value
			if (prop instanceof CSSUnitValue) {
				return prop.value;
			}

			// All others (such as CSSKeywordValue)
			//~> Return the string
			return prop.toString().trim();
		});
	}

	paint(ctx, geom, properties) {
		// --- CONFIG ---
		  const [
			innerRadius = 10,
			thickness = 50,
			ringX = 50,
			ringY = 50,
			count = 100,
			rows= 5,
			color = 'hotpink',
			size = 2,
			minAlpha = 0,
			maxAlpha = 1,
			fadeEasing = 'ease-in',
			animationTick = 0,
		  ] = this.parseProps(properties);

		const cx = (geom.width * ringX) / 100;
		const cy = (geom.height * ringY) / 100;
		const [bx1, by1, bx2, by2] = this.parseEasing(fadeEasing);
		const t = animationTick * Math.PI * 2;

		// Defining the Band
		const outerRadius = innerRadius + thickness;
		// Midpoint is max visibility
		const midRadius = innerRadius + (thickness / 2);

		ctx.fillStyle = color;

		for (let r = 0; r < rows; r++) {
			const rowProgress = rows > 1 ? r / (rows - 1) : 0;
			const currentBaseRadius = innerRadius + (rowProgress * thickness);

			for (let i = 0; i < count; i++) {
				const angle = (i / count) * Math.PI * 2;

				// --- WAVE PHYSICS ---
				const w1 = Math.sin((angle * 5) + t);
				const w2 = Math.sin((angle * 3) - t);
				const rowOffset = Math.sin((r * 0.3) + t);
				const waveHeight = w1 + w2 + rowOffset;

				// --- DEPTH OPACITY (From Wave Height) ---
				let normalized = (waveHeight + 3) / 6;
				normalized = Math.pow(Math.max(0, normalized), 1.5);
				let alpha = minAlpha + (normalized * (maxAlpha - minAlpha));

				// --- POSITION ---
				const distortion = waveHeight * 10;
				const finalRadius = currentBaseRadius + distortion;
				const x = cx + Math.cos(angle) * finalRadius;
				const y = cy + Math.sin(angle) * finalRadius;

				// --- DUAL EDGE FADE LOGIC ---

				// 1. Calculate distances to boundaries
				const distFromInner = finalRadius - innerRadius;
				const distFromOuter = outerRadius - finalRadius;

				// 2. Find closest edge distance (if negative, we are outside the ring)
				let closestEdgeDist = Math.min(distFromInner, distFromOuter);

				// 3. Normalize this distance
				// 0 means "At the edge"
				// (thickness / 2) means "Exactly in the middle"
				const halfThick = thickness / 2;
				let visibility = closestEdgeDist / halfThick;

				// 4. Clamp & Clip
				// If < 0, particle has drifted outside the geometric bounds -> Hide it
				if (visibility < 0) visibility = 0;
				if (visibility > 1) visibility = 1;

				// 5. Apply Configurable Easing
				// User wants control over interpolation.
				// Input: 0 (Invisible/Edge) -> 1 (Visible/Center)
				const easeT = this.solveBezierX(visibility, bx1, bx2);
				const easedVisibility = this.getBezierValue(easeT, 0, by1, by2, 1);

				// 6. Combine
				alpha = alpha * easedVisibility;

				// Final Safety
				if (alpha < 0) alpha = 0; if (alpha > 1) alpha = 1;

				if (alpha > 0.01) { // Performance: Don't draw invisible dots
				ctx.globalAlpha = alpha;
				ctx.beginPath();
				ctx.arc(x, y, size, 0, 2 * Math.PI);
				ctx.fill();
				}
			}
		}
	}
}

registerPaint('ring-particles', RingParticles);
