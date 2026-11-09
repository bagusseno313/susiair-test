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

Future dates will also show value on all toggles if the past dates have data, since rolling sum means it also includes past data. However, I don’t include the future date to the sum. Since we assume today is 15 May 2026, then beyond that date we assume as future dates.
For example, assume today is 9 November, then tomorrow is 10 November. On 1w and date is 10 November, it will sum data from 4 November 2026 to 9 November 2026. Another example, on date 11 November 2026, it will calculate data from 5 November 2026 to 9 November 2026.
