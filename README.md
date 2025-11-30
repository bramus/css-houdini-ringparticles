# CSS Houdini Ring Particles

A CSS Houdini Paint Worklet to draw particles on a ring geometry.

![CSS Houdini Ring Particles](./assets/css-houdini-ringparticles.png?raw=true)

## Usage

### 1. Getting `css-houdini-ringparticles`

#### Using a pre-built hosted version

The easiest way to get `css-houdini-ringparticles` is to use the prebuilt version through UNPKG. Just skip ahead to step 2 in that case.

#### Installing it Locally

You can install the `css-houdini-ringparticles` locally using NPM.

```bash
npm install css-houdini-ringparticles
```

Alternatively you can clone [the `css-houdini-ringparticles` repo](https://github.com/bramus/css-houdini-ringparticles/) and after manually build the project:

```bash
cd css-houdini-ringparticles
npm install
npm run build
```

You'll find the built file in the `./dist` folder.

### 2. Loading `css-houdini-ringparticles`

To include it you must loads the module in the given JavaScript file and add it to the Paint Worklet.

If you want to use the UNPKG hosted version of `css-houdini-ringparticles`, use `https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js` as the `moduleURL`.

```js
if ('paintWorklet' in CSS) {
	CSS.paintWorklet.addModule(
		'https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js'
	);
}
```

If you've installed `css-houdini-ringparticles` using NPM or have manually built it, refer to its local url:

```js
if ('paintWorklet' in CSS) {
	CSS.paintWorklet.addModule('url/to/ringparticles.js');
}
```

#### A note on older browsers

To add support for [browsers that don't speak Houdini](https://ishoudinireadyyet.com/), you can include the [css-paint-polyfill](https://github.com/GoogleChromeLabs/css-paint-polyfill) before loading the Worklet.

```html
<script>
	(async function () {
		if (CSS['paintWorklet'] === undefined) {
			await import('https://unpkg.com/css-paint-polyfill');
		}

		CSS.paintWorklet.addModule(
			'https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js'
		);
	})();
</script>
```

### 3. Applying `css-houdini-ringparticles`

To use Ring Particles Paint Worklet you need to set the `background-image` property to `paint(ringparticles)`

```css
.element {
	background-image: paint(ring-particles);
}
```

## Configuration

You can tweak the appearance of the Ring Particles Paint Worklet by setting some CSS Custom Properties

/* TODO */

### Example

```css
.element {
	/* Ring Particles Base Config */
	--ring-radius: 120;
	--ring-thickness: 120;
	--particle-count: 90;
	--particle-rows: 35;
	--particle-size: 2;
	--particle-color: #00d2ff;
	
	/* Slight visibility in troughs */
	--particle-min-alpha: 0.1;
	--particle-max-alpha: 1.0;

	/* Easing: Controls how fast it fades from the edge to the center */
	/* 'ease-out' makes the edges soft but quickly visible. */
	/* 'ease-in' makes the edges stay invisible longer (sharper center). */
	--fade-easing: 'ease-in'; 

	/* Position of the ring, in percent (0-100) */
	--ring-x: 50;
	--ring-y: 50;

	/* Seed for the "predictable random" generator */
	/* See https://jakearchibald.com/2020/css-paint-predictably-random/ for details */
    --seed: 42;

	background-image: paint(ring-geometry);
}
```

If you want to animate the ring, animate an `--animation-tick` custom property:

```css
@property --animation-tick { syntax: '<number>'; inherits: false; initial-value: 0; }
@keyframes ripple { 0% { --animation-tick: 0; } 100% { --animation-tick: 1; } }

.element {
	animation: ripple 6s linear infinite;
}
```

### Registering the Custom Properties

To properly animate the Custom Properties and to make use of the built-in syntax validation you [need to register the Custom Properties](https://web.dev/at-property/). Include this CSS Snippet to do so:

```css
@property --ring-radius { syntax: '<number> | random'; inherits: false; initial-value: random; }
@property --ring-thickness { syntax: '<number> | random'; inherits: false; initial-value: random; }
@property --ring-x { syntax: '<number>'; inherits: false; initial-value: 50; }
@property --ring-y { syntax: '<number>'; inherits: false; initial-value: 50; }
@property --particle-count { syntax: '<number> | random'; inherits: false; initial-value: random; }
@property --particle-rows { syntax: '<number> | random'; inherits: false; initial-value: random; }
@property --particle-size { syntax: '<number> | random'; inherits: false; initial-value: random; }
@property --particle-color { syntax: '<color> | random'; inherits: false; initial-value: random; }
@property --particle-min-alpha { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --particle-max-alpha { syntax: '<number>'; inherits: false; initial-value: 1; }
@property --fade-easing { syntax: '<string>'; inherits: false; initial-value: "ease-in"; }
@property --seed { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --animation-tick { syntax: '<number>'; inherits: false; initial-value: 0; }
```

💡 Inclusion of this code snippet is not required, but recommended. The only properties you really would want to animate/transition are:

```css
@property --ring-x { syntax: '<number>'; inherits: false; initial-value: 50; }
@property --ring-y { syntax: '<number>'; inherits: false; initial-value: 50; }
@property --particle-color { syntax: '<color> | random'; inherits: false; initial-value: random; }
@property --animation-tick { syntax: '<number>'; inherits: false; initial-value: 0; }
```

## Demo / Development

You can play with a small demo on CodePen over at [https://codepen.io/bramus/pen/RNaJXEB](https://codepen.io/bramus/pen/RNaJXEB)

If you've cloned the repo you can run `npm run demo` to launch the included demo.

## License

`css-houdini-ringparticles` is released under the MIT public license. See the enclosed `LICENSE` for details.
