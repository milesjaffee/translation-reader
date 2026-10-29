import { AlignedWord, AlignmentResult } from '../translation-output/alignment.model';
import { HoveredWord } from '../translation-output/word-output/word-output.component';

export interface DemoAlignment {
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  targetText: string;
  result: AlignmentResult;
  /** Word shown hovered until the visitor hovers something else. */
  defaultHover: HoveredWord;
}

/** [word, meanings, match, sentence, latin?, footnote?] */
type W = [string, string[], number[], number, string?, string?];

const words = (ws: W[]): AlignedWord[] =>
  ws.map(([word, meaning, match, sentence, latin, footnote]) => ({
    word,
    meaning,
    match,
    sentence,
    footnote: footnote ?? null,
    ...(latin !== undefined ? { latin } : {}),
  }));

const result = (source: W[], translation: W[]): AlignmentResult => ({
  source: words(source),
  translation: words(translation),
  target: '',
  translated_by: null,
});

const DAO = ['The Tao', 'way', 'path'];

export const DAODEJING_DEMO: DemoAlignment = {
  sourceLang: 'lzh',
  targetLang: 'en',
  sourceText: '道可道，非常道',
  targetText: 'The Way that can be translated is not the eternal Way',
  defaultHover: { side: 'source', idx: 3 },
  result: result(
    [
      ['道', DAO, [1, 2], 0, 'dào'],
      ['可', ['can', 'may', 'able to'], [3, 4], 0, 'kě'],
      ['道', ['The Tao', 'to speak', 'to translate', 'The Way'], [5, 6], 0, 'dào', 'This is the same character used to express ‘the way’'],
      ['，', [], [], 0, ''],
      ['非', ['not', 'non-', 'un-'], [7, 8], 1, 'fēi'],
      ['常', ['eternal', 'constant', 'unchanging'], [9, 10], 1, 'cháng'],
      ['道', DAO, [11], 1, 'dào'],
    ],
    [
      ['The', [], [1], 0],
      ['Way', ['道'], [1], 0],
      ['that', [], [], 0],
      ['can', ['可'], [2], 0],
      ['be', [], [3], 0],
      ['translated', ['道'], [3], 0],
      ['is', [], [5], 1],
      ['not', ['非'], [5], 1],
      ['the', [], [], 1],
      ['eternal', ['常'], [6], 1],
      ['Way', ['道'], [7], 1],
    ],
  ),
};

export const COBRA_DEMO: DemoAlignment = {
  sourceLang: 'es',
  targetLang: 'en',
  sourceText: '“¡Socorro, me ha picado una víbora!” “¿Cobra?” “No, gratis.”',
  targetText: '“Help, I’ve been bitten by a viper!” “Does it cost money?” “No, it’s free.”',
  defaultHover: { side: 'source', idx: 14 },
  result: result(
    [
      ['“', [], [1], 0],
      ['¡', [], [], 0],
      ['Socorro', ['Help!'], [2], 0],
      [',', [], [3], 0],
      ['me', ['me', 'myself'], [4], 0],
      ['ha', ['has', 'have'], [5, 6, 7], 0],
      ['picado', ['bitten', 'stung'], [8], 0],
      ['una', ['a', 'one'], [10], 0],
      ['víbora', ['viper', 'snake'], [11], 0],
      ['!', [], [12], 0],
      ['”', [], [13], 0],
      ['“', [], [14], 1],
      ['¿', [], [], 1],
      ['Cobra', ['A cobra?', 'Does it cost money?'], [15, 16, 17, 18], 1, undefined, 'This is a pun: ‘cobra’ can mean either “it costs” or a reference to the snake.'],
      ['?', [], [19], 1],
      ['”', [], [20], 1],
      ['“', [], [21], 2],
      ['No', ['No'], [22], 2],
      [',', [], [23], 2],
      ['gratis', ['free', 'gratis'], [24, 25, 26, 27], 2],
      ['.', [], [28], 2],
      ['”', [], [29], 2],
    ],
    [
      ['“', [], [1], 0],
      ['Help', ['¡Socorro!', '¡Ayuda!'], [3], 0],
      [',', [], [4], 0],
      ['I', ['me'], [5], 0],
      ['’', [], [], 0],
      ['ve', ['ha'], [6], 0],
      ['been', ['ha'], [6], 0],
      ['bitten', ['picado'], [7], 0],
      ['by', [], [], 0],
      ['a', ['una'], [8], 0],
      ['viper', ['víbora'], [9], 0],
      ['!', [], [10], 0],
      ['”', [], [11], 0],
      ['“', [], [12], 1],
      ['Does', ['cobra'], [14], 1],
      ['it', ['cobra'], [14], 1],
      ['cost', ['cobra'], [14], 1],
      ['money', ['cobra'], [14], 1],
      ['?', [], [15], 1],
      ['”', [], [16], 1],
      ['“', [], [17], 2],
      ['No', ['No'], [18], 2],
      [',', [], [19], 2],
      ['it', ['gratis'], [20], 2],
      ['’', [], [20], 2],
      ['s', ['gratis'], [20], 2],
      ['free', ['gratis'], [20], 2],
      ['.', [], [21], 2],
      ['”', [], [22], 2],
    ],
  ),
};
