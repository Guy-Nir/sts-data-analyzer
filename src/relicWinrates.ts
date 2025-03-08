import fs from 'fs'
import { unzip } from 'un-gzip'

export interface Run {
    event: {
        is_daily: boolean;
        character_chosen: string;
        ascension_level: number;
        neow_bonus: string;
        relics: string[];
        victory: boolean;
        relics_obtained: { floor: number, key: string }[];
    }
}


export interface DataPlugin {
    name: string;
    collectRunData: (run: Run) => void;
    getData: () => string;
}

const relicStats: Record<string, { wins: number, losses: number }> = {};

const addRunsToStats = (runs: Run[]) => {

    for (let run of runs) {

        if (run.event.is_daily) {
            continue;
        }

        for (let relic of run.event.relics) {

            if (!relicStats[relic]) {
                relicStats[relic] = { wins: 0, losses: 0 };
            }

            if (run.event.victory) {
                relicStats[relic].wins++;
            } else {
                relicStats[relic].losses++;
            }
        }
    }

    return relicStats
}

const calculateWinares = () => {
    const relicsByWinrate: { name: string, winrate: number, wins: number, losses: number }[] = [];

    for (let relic in relicStats) {
        const runs = relicStats[relic];
        const winrate = runs.wins / (runs.wins + runs.losses);

        relicsByWinrate.push({ name: relic, winrate, ...runs })
    }

    relicsByWinrate.sort(({ winrate: winrateA }, { winrate: winrateB }) => winrateA - winrateB);

    return relicsByWinrate.map(({ winrate, ...others }) => ({ winrate: (winrate * 100).toFixed(2) + '%', ...others }));
}

const main = async () => {
    const runFiles: string[] = fs.readdirSync('files');

    for (let i = 0; i < runFiles.length; i++) {
        const newName = await unzipRun(runFiles[i]);

        const runs: Run[] = JSON.parse(fs.readFileSync(newName, 'ascii'));

        if (i % 10 == 0) {
            console.log(`At ${i}/${runFiles.length} - ${i / runFiles.length * 100}%`)
        }

        fs.unlinkSync(newName);
        addRunsToStats(runs);
    }

    const winrates = calculateWinares();
    console.log(JSON.stringify(winrates));
}

const unzipRun = async (fileName: string) => {
    const name = `files/${fileName}`;
    const newName = `files/${fileName}.unzipped`;

    return new Promise<string>((res, _rej) => {
        unzip(name, newName, () => {
            res(newName);
        });
    })
}

main();

