import type Portfolio from "./interfaces/portfolio";

const file = Bun.file(import.meta.dir + '/assets/portfolio.json');

const portfolio: Portfolio = await file.json();

for (const key in portfolio.tikers) {
    const [history15, history50] = await Promise.all([
        getEmitentAverage(key, 15),
        getEmitentAverage(key, 50),
    ]);
    const trandCourse = history15 > history50;

    if (trandCourse !== portfolio.tikers[key]) {
        portfolio.tikers[key] = trandCourse;
        console.log(`Тренд ${key} изменился`);
    }
}

await Bun.write(file, JSON.stringify(portfolio, null, 2));

async function getEmitentAverage(emitentName: string, daysOffset: 15 | 50): Promise<number> {
    if (!emitentName || !daysOffset) {
        return Promise.reject();
    }

    let result = 0;
    const url = new URL(`${process.env.API_SECURITIES_HISTORY}/${emitentName}.json`);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysOffset);

    url.searchParams.append('from', startDate.toLocaleDateString('en-CA'))
    url.searchParams.append('till', new Date().toLocaleDateString('en-CA'))

    const request = await fetch(url);
    const historyData = await request.json();

    const { data } = historyData.history;
    const length = Math.min(daysOffset, data.length) - 1;

    for (let i = length; i >= 0; i--) {
        result += data[i][11];
    }

	return result / daysOffset;
}