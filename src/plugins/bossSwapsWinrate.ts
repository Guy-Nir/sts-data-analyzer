import { Run } from '..';
import { DataPlugin, PluginConfig } from '../plugins'
import { sortObject } from '../utils';

const BOSS_RELICS = ["SacredBark", "Pandora's Box", "Fusion Hammer", "Coffee Dripper", "Astrolabe", "SlaversCollar", "VioletLotus", "WristBlade", "Velvet Choker", "Runic Dome", "Snecko Eye", "Ectoplasm", "Runic Pyramid", "Sozu", "Cursed Key", "Calling Bell", "Busted Crown", "Empty Cage", "Tiny House", "Inserter", "Philosopher's Stone", "Black Star", "Mark of Pain", "Nuclear Battery", "HoveringKite", "Runic Cube"];

type RelicStats = { wins: number, losses: number, name: string };

export class BossSwapsWinratesPlugin implements DataPlugin {
    name = 'boss-swap-winrate'
    private relicsStats: Record<string, RelicStats> = {};

    constructor(public config: PluginConfig) {
    }

    collectRunData = (run: Run) => {
        if (run.event.neow_bonus != 'BOSS_RELIC') {
            return;
        }

        const relic = run.event.relics[0];

        //relic was swapped in n'loth
        if (!BOSS_RELICS.includes(relic)) {
            return;
        }

        if (!this.relicsStats[relic]) {
            this.relicsStats[relic] = { wins: 0, losses: 0, name: relic };
        }

        if (run.event.victory) {
            this.relicsStats[relic].wins++;
        } else {
            this.relicsStats[relic].losses++;
        }

    }

    getData = (): object => {
        return sortObject(this.relicsStats, this.getWinrate, this.formatRelicStats);
    }

    private getWinrate = (relicStats: RelicStats) => {
        return relicStats.wins / (relicStats.wins + relicStats.losses);
    }

    private formatRelicStats = (relicStats: RelicStats) => {
        return { winrate: (this.getWinrate(relicStats) * 100).toFixed(2) + '%', ...relicStats };
    }
}
