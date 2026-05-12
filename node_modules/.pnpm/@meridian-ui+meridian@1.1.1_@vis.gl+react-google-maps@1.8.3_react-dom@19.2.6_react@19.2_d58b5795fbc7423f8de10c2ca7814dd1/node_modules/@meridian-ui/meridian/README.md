# Meridian: A Design Framework for Malleable Overview-Detail Interfaces

> Bryan Min and Haijun Xia. 2025. Meridian: A Design Framework for Malleable Overview-Detail Interfaces. In The 38th Annual ACM Symposium on User Interface Software and Technology (UIST ’25), September 28-October 1, 2025, Busan, Republic of Korea. ACM, New York, NY, USA, 13 pages. https://doi.org/10.1145/3746059.3747654

This repository contains the Meridian developer package and two applications: a gallery of three example real-world ODIs and a no-code website builder.

## Meridian Specification Types

The Meridian specification is a JSON-based language for describing overview-detail interfaces.

To view the full specification types, navigate to `src/spec/spec.ts`.

To view the full specification for the three real-world examples from Section 5, navigate to the following files:

- Example 1: `examples/gallery/src/views/d2-1/att.meridian.ts`
- Example 2: `examples/gallery/src/views/d2-2/soccer.meridian.ts`
- Example 3: `examples/gallery/src/views/d2-3/thesaurus.meridian.ts`

To view the hotels specification from the video figure, navigate to: `examples/gallery/src/views/hotels/hotels.meridian.ts`

## Gallery Website

First, in the root directory, run

```
npm link meridian
```

(`meridian` being the name of the root directory)

Then navigate to `examples/gallery`, and run:

```
npm link
npm install
```

To run the gallery app, run:

```
npm run dev
```

## Website Builder Application

Similar to running the gallery website, first should run

```
npm link meridian
```

Then navigate to `examples/web-builder`, and run:

```
npm link
npm install
```

To run the gallery app, run:

```
npm run dev
```
