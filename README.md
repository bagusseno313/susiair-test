# SusiAir Test for Full Stack Developer by Bagus Seno Pamungkas

Hi, thank you for trying this project, and hope this project finds you well. Please continue reading to setup SusiAir Test for Full Stack Developer.

## Backend/NestJS

### Setup

```bash
$ cd nest
$ pnpm install
```

### Run

```bash
$ pnpm start:dev
```

This will run on port 3001 by default. To change port, create an .env file and set
PORT=Your preferred port

## Frontend/Nuxt

### Setup

```bash
$ cd nuxt
$ pnpm install
```

### Run

```bash
$ pnpm dev
```

That will run on port 3000 by default. To change the port, run with -p YOUR_PORT

## Approach decision

### Dates before the earliest date that are included in the window

The dates before the earliest date in dataset could be included in the window. I decided to treat them with zero value when calculating sum, so they won't add any hours. I think this is fine since it's a summation, not calculating an average. If we calculate average, we have to make sure the missing dates' flight hours: are there actually no flight hours? Or perhaps there are actually flight hours but not recorded on the dataset, since this could mislead the calculation.

Also, I provided a notice when there is a missing date. If you try to set REFERENCE_DATE in nest/src/common/reference-date.ts to the earliest date, you will find a notice that there are missing dates data.

### Futures dates

Future dates will also show value on all toggles if the past dates have data, since rolling sum means it also includes past data.

For example, on 1w and date is today, it will calculate data from (today - 6 days) to today:
Assume today: 9 November 2026
6 days before: 3 November 2026
Period: 3–9 November 2026

However, the test documentation stated to make today as 15 may 2026, while the dataset has dates until 31 May 2026. This makes "future" dates also have data. To be honest I'm a bit confused whether I have to delete dates from 16 May 2026 and beyond. I don't see any such instruction so I keep dates from 16 May and beyond. If you want to see real dates with missing future dates, please make the REFERENCE_DATE in nest/src/common/reference-date.ts to 31 May 2026.
