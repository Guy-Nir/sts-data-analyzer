import { Run } from '..';
import { DataPlugin, PluginConfig } from '../plugins'
import { sortObject } from '../utils';

type RelicStats = { given: number, notGiven: number };

export class GivenToNlothPlugin implements DataPlugin {
    name = 'given-to-nloth'
    private relicsStats: Record<string, RelicStats> = {};

    constructor(public config: PluginConfig) {
    }

    collectRunData = (run: Run) => {
        const event = run.event.event_choices.find(event => event.event_name == "N'loth")

        if (!event) {
            return;
        }

        const maybeRelicGiven = event.relics_lost?.[0];


        for (let relic of run.event.relics) {
            if (!this.relicsStats[relic]) {
                this.relicsStats[relic] = { given: 0, notGiven: 0 };
            }

            if (relic != maybeRelicGiven) {
                this.relicsStats[relic].notGiven++;
            }
        }

        if (maybeRelicGiven) {

            if (!this.relicsStats[maybeRelicGiven]) {
                this.relicsStats[maybeRelicGiven] = { given: 0, notGiven: 0 };
            }

            this.relicsStats[maybeRelicGiven].given++;
        }

    }

    getData = (): object => {
        return sortObject(this.relicsStats, this.getPickrate, this.formatRelicStats);
    }

    private getPickrate = (relicStats: RelicStats) => {
        return relicStats.given / (relicStats.given + relicStats.notGiven);
    }

    private formatRelicStats = (name: string, relicStats: RelicStats) => {
        return { pickrate: (this.getPickrate(relicStats) * 100).toFixed(2) + '%', name, ...relicStats };
    }
}
