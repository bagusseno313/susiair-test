# SusiAir Test for Full Stack Developer by Bagus Seno Pamungkas

Hi, thank you for trying this project, and hope this project finds you well. Please continue reading to setup SusiAir Test for Full Stack Developer.

## Backend/NestJS

### Setup

```bash
cd nest
pnpm install
```

### Run

```bash
pnpm start:dev
```

This will run on port 3001 by default. To change port, create an .env file and set:

```env
PORT=Your preferred port
```

## Frontend/Nuxt

### Setup

```bash
cd nuxt
pnpm install
```

### Run

```bash
pnpm dev
```

That will run on port 3000 by default. To change the port, run with `--port YOUR_PORT`.

## Approach decisions

### Dates before the earliest date in the dataset

Dates before the earliest available record can fall inside a rolling window. They are treated as zero flight hours and are included in the missing-data notice when applicable. This avoids silently treating an unknown value as a recorded flight hour.

### Future dates

The application's reference date (Today) is hardcoded to **15 May 2026** in `nest/src/common/reference-date.ts`.

The chart still displays seven days before and after Today. However, calculations never include records after 15 May 2026, even though the mock dataset contains records through 31 May 2026. Future dates are also not counted as missing data.

For a 1w rolling window:

- The point for 15 May uses 9–15 May.
- The point for 21 May uses its original window, 15–21 May, but only 15 May is eligible for the sum.
- The point for 22 May uses 16–22 May. Since the entire window is after Today, its value is 0.

This keeps each chart point's rolling window anchored to its own date while preventing future-dated mock records from affecting the calculation.
