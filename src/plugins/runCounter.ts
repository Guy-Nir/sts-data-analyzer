import { Run } from '..';
import { DataPlugin, PluginConfig } from '../plugins'

export class RunCounterPlugin implements DataPlugin {
    name = 'runCounter';
    runCount = 0;

    constructor(public config: PluginConfig) { }

    collectRunData = (_run: Run) => {
        this.runCount++;
    }

    getData = () => {
        return { runCount: this.runCount };
    }
}
