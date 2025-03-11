import fs from 'fs'
import { unzipRun } from './utils';
import { createPluginsByCharacter, defaultPluginConfig, doesRunMatchConfig, generatePluginFilename } from './plugins';
import { BossSwapsWinratesPlugin } from './plugins/bossSwapsWinrate';
import { RunCounterPlugin } from './plugins/runCounter';
import { MindBloomChoicePlugin } from './plugins/mindBloomChoice';
import { LivingWallChoicePlugin } from './plugins/livingWallChoice';
import { GivenToNlothPlugin } from './plugins/givenToNloth';
import { CardsEloPlugin } from './plugins/cardsElo';

export const dataFilesDir = '/games/slaythedata/STS_Data';
//export const dataFilesDir = 'example-files';

export interface Run {
    event: {
        is_daily: boolean;
        character_chosen: string;
        ascension_level: number;
        neow_bonus: string;
        relics: string[];
        victory: boolean;
        card_choices: { not_picked: string[], picked: string, floor: number }[];
        relics_obtained: { floor: number, key: string }[];
        items_purchased: string[];
        event_choices: { event_name: string, player_choice: string, relics_lost?: string[], floor: number }[];
    }
}

const feedDataToPlugins = (runs: Run[]) => {
    for (let run of runs) {
        for (let plugin of plugins) {
            if (doesRunMatchConfig(run, plugin.config)) {
                plugin.collectRunData(run);
            }
        }
    }
}

const collectData = async (startTime: number) => {
    const runFiles: string[] = fs.readdirSync(dataFilesDir);
    console.log(`Found ${runFiles.length} files`);

    for (let i = 0; i < runFiles.length; i++) {
        const newName = await unzipRun(runFiles[i]);

        const runs: Run[] = JSON.parse(fs.readFileSync(newName, 'ascii'));

        if (i % 10 == 0) {
            const time = Date.now();
            console.log(`At ${i}/${runFiles.length} - ${(i / runFiles.length * 100).toFixed(2)}% - elapsed ${((time - startTime) / 1000).toFixed(2)}s`)
        }

        fs.unlinkSync(newName);
        feedDataToPlugins(runs);
    }
}

const savePluginsData = () => {

    const previousResultDirs = fs.readdirSync('results');
    const previousLatest = previousResultDirs.find((dirname) => dirname.startsWith('latest-'));

    if (previousLatest) {
        const newName = previousLatest.split('latest-')[1];

        fs.renameSync(`results/${previousLatest}`, `results/${newName}`);
    }

    const dirName = `results/latest-${Date.now()}`
    fs.mkdirSync(dirName);

    for (let plugin of plugins) {
        const pluginResult = plugin.getData();

        const filename = generatePluginFilename(plugin.name, plugin.config);
        fs.writeFileSync(`${dirName}/${filename}.json`, JSON.stringify(pluginResult, null, 2));
    }
}

const plugins = [
    new RunCounterPlugin(defaultPluginConfig),
    ...createPluginsByCharacter(CardsEloPlugin, { ascension: 'ALL-ASC' }),
    ...createPluginsByCharacter(CardsEloPlugin, { ascension: 'A20' })
    //...createPluginsByCharacter(BossSwapsWinratesPlugin, { ascension: 'ALL-ASC' }),
    //...createPluginsByCharacter(MindBloomChoicePlugin, { ascension: 'ALL-ASC' }),
    //...createPluginsByCharacter(LivingWallChoicePlugin, { ascension: 'ALL-ASC' }),
    //...createPluginsByCharacter(GivenToNlothPlugin, { ascension: 'ALL-ASC' })
];

const main = async () => {
    const startTime = Date.now();

    await collectData(startTime);
    savePluginsData();

    console.log(`Done! total ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
}

main();
