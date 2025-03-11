import { Run } from '..';
import { DataPlugin, PluginConfig } from '../plugins'
import { sortObject } from '../utils';

const STARTING_ELO = 1000;
const K_FACTOR = 32;

type Score = 0 | 0.5 | 1;

type CardStats = { count: number, elo: number };

export class CardsEloPlugin implements DataPlugin {
    name = 'cards-elo';
    cards: Record<string, CardStats> = {};

    constructor(public config: PluginConfig) { }

    collectRunData = (run: Run) => {
        //Don't want to deal with that...
        if (run.event.items_purchased?.includes('PrismaticShard')) {
            return;
        }

        for (let cardChoice of this.getFilteredCardChoices(run)) {
            const pickedCard = cardChoice.picked;

            if (pickedCard != 'SKIP' && pickedCard != 'Singing Bowl') {
                this.adjustScoresForPicked(pickedCard, cardChoice.not_picked, run);
            }

            this.adjustScoresForNotPicked(cardChoice.not_picked);
        }
    }

    getData = () => {
        const cardStats = sortObject(this.cards, ({ elo }) => elo, (name, stats) => ({ name, ...stats }));

        return this.filterModdedCards(cardStats);
    }


    private adjustScoresForPicked = (pickedCard: string, notPickedCards: string[], run: Run) => {
        try {
            for (let notPickedCard of notPickedCards) {
                this.resolveChoice({ name: pickedCard, score: 1 }, { name: notPickedCard, score: 0 });
            }
        } catch (e) {
            console.log(JSON.stringify(run, null, 2));
            process.exit(0);
        }
    }

    private adjustScoresForNotPicked = (notPickedCards: string[]) => {
        for (let i = 0; i < notPickedCards.length; i++) {
            for (let j = i + 1; j < notPickedCards.length; j++) {
                this.resolveChoice({ name: notPickedCards[j], score: 0.5 }, { name: notPickedCards[i], score: 0.5 });
            }
        }
    }

    private resolveChoice = (cardA: { name: string, score: Score }, cardB: { name: string, score: Score }) => {
        const cardAElo = this.getCardElo(cardA.name);
        const cardBElo = this.getCardElo(cardB.name);

        const cardAExpectedScore = this.getExpectedScore(cardAElo, cardBElo);
        this.adjustCardScore(cardA.name, cardA.score, cardAExpectedScore)

        const cardBExpectedScore = this.getExpectedScore(cardBElo, cardAElo);
        this.adjustCardScore(cardB.name, cardB.score, cardBExpectedScore)
    }

    private adjustCardScore = (cardName: string, score: 0 | 0.5 | 1, expectedScore: number) => {
        this.cards[cardName].elo += K_FACTOR * (score - expectedScore);
        this.cards[cardName].count += 1;
    }

    private getCardElo = (cardName: string) => {
        const cardStats = this.cards[cardName];

        if (!cardStats) {
            this.cards[cardName] = { elo: STARTING_ELO, count: 0 };
            return this.cards[cardName].elo;
        }

        return cardStats.elo;
    }

    private getExpectedScore = (eloA: number, eloB: number): number => {
        return 1 / (1 + 10 ** ((eloB - eloA) / 400));
    }

    private filterModdedCards = (cards: CardStats[]) => {
        //since there's seemingly no way to know if a run is modded
        //assume if a card appeared much less than the average card it is probably modded or was picked through a mod 
        //this also ensures cards from bugged files are filtered (there are some files that start on floor 51 for some reason)
        const averageCardCount = cards.map(c => c.count).reduce((a, b) => a + b) / cards.length;

        return cards.filter(c => c.count * 100 > averageCardCount);
    }

    private getFilteredCardChoices = (run: Run) => {
        const floorsToSkip: number[] = [];

        if (run.event.neow_bonus?.includes('COLORLESS')) {
            floorsToSkip.push(0);
        }

        const sensoryStoneEvent = run.event.event_choices.find(event => event.event_name == 'SensoryStone');

        if (sensoryStoneEvent) {
            floorsToSkip.push(sensoryStoneEvent.floor);
        }

        return run.event.card_choices.filter(choice => !floorsToSkip.includes(choice.floor));
    }
}
