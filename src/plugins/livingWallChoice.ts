import { Run } from '..';
import { DataPlugin, PluginConfig } from '../plugins'
import { sortObject } from '../utils';

type ChoiceStats = { picked: number, notPicked: number };

export class LivingWallChoicePlugin implements DataPlugin {
    name = 'living-wall-choice';

    private choiceStats: Record<string, ChoiceStats> = {
        Change: { picked: 0, notPicked: 0 },
        Forget: { picked: 0, notPicked: 0 },
        Grow: { picked: 0, notPicked: 0 },
    };

    constructor(public config: PluginConfig) { }

    collectRunData = (run: Run) => {
        const event = run.event.event_choices.find(event => event.event_name == 'Living Wall')

        if (!event) {
            return;
        }

        for (let choice in this.choiceStats) {
            if (choice == event.player_choice) {
                this.choiceStats[choice].picked++;
            } else {
                this.choiceStats[choice].notPicked++;
            }
        }
    }

    getData = () => {
        return sortObject(this.choiceStats, this.getPickRate, this.formatChoiceStats);
    }

    private getPickRate = (choiceStats: ChoiceStats) => {
        return choiceStats.picked / (choiceStats.picked + choiceStats.notPicked);
    }

    private formatChoiceStats = (name: string, choiceStats: ChoiceStats) => {
        return { pickRate: (this.getPickRate(choiceStats) * 100).toFixed(2) + '%', name, ...choiceStats };
    }
}
