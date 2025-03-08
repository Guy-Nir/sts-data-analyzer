import { Run } from '..';
import { DataPlugin, PluginConfig } from '../plugins'

export class UnnamedPlugin implements DataPlugin {
    name = 'no-name';

    constructor(public config: PluginConfig) { }

    collectRunData = (run: Run) => {
    }

    getData = () => {
        return {};
    }
}
