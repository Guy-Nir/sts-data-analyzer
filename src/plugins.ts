import { Run } from ".";

const characters = ['IRONCLAD', 'THE_SILENT', 'DEFECT', 'WATCHER', 'ALL-CHARS'] as const;
export type CharacterName = (typeof characters)[number];

export type Ascension = 'A20' | 'ALL-ASC';

export interface PluginConfig {
    characterName: CharacterName;
    ascension: Ascension;
}

export const defaultPluginConfig: PluginConfig = {
    characterName: 'ALL-CHARS',
    ascension: 'ALL-ASC'
}

export interface DataPlugin {
    name: string;
    config: PluginConfig;
    collectRunData: (run: Run) => void;
    getData: () => object;
}


const ascensionNumber = (asc: Ascension): number => {
    if (asc == 'A20') {
        return 20;
    }

    return NaN;
}

const displayCharacterName = (name: CharacterName) => {
    return name == 'THE_SILENT' ? 'silent' : name.toLowerCase();
}

export const generatePluginFilename = (pluginName: string, config: PluginConfig) => {
    return `${config.ascension.toLowerCase()}_${displayCharacterName(config.characterName)}_${pluginName}`;
}

export const doesRunMatchConfig = (run: Run, config: PluginConfig): boolean => {
    if (config.characterName != 'ALL-CHARS' && run.event.character_chosen != config.characterName) {
        return false;
    }

    if (config.ascension != 'ALL-ASC' && run.event.ascension_level != ascensionNumber(config.ascension)) {
        return false;
    }

    return true;
}

export const createPluginsByCharacter = <T extends DataPlugin>(plugin: new (config: PluginConfig) => T, otherConf: Omit<PluginConfig, 'characterName'>): T[] => {
    return characters.map(characterName => new plugin({ characterName, ...otherConf }));
}
