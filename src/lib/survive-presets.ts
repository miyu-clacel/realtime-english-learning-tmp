import type { QuizQuestion } from "./types";

export type SurvivePresetId = "a2" | "b1" | "b2" | "c1";

type QuestionDraft = Omit<QuizQuestion, "id">;

export interface SurvivePreset {
  id: SurvivePresetId;
  label: string;
  description: string;
  questions: QuestionDraft[];
}

function withIds(questions: QuestionDraft[]): QuizQuestion[] {
  return questions.map((q, i) => ({ ...q, id: i + 1 }));
}

const A2_QUESTIONS: QuestionDraft[] = [
  { sentence: "I ___ a student.", answer: "am", hint: "be動詞（一人称）" },
  { sentence: "She ___ tennis every week.", answer: "plays", hint: "一般現在・三人称単数" },
  { sentence: "They ___ home at six yesterday.", answer: "got", hint: "過去形（get home）" },
  { sentence: "This bag is ___ than that one.", answer: "cheaper", hint: "比較級" },
  { sentence: "Can I ___ your pen?", answer: "use", hint: "「使ってもいい？」" },
  { sentence: "There ___ many people in the room.", answer: "are", hint: "There構文（複数）" },
  { sentence: "He ___ watching TV now.", answer: "is", hint: "現在進行形" },
  { sentence: "I usually ___ breakfast at seven.", answer: "have", hint: "一般現在" },
  { sentence: "We ___ to London last summer.", answer: "went", hint: "go の過去形" },
  { sentence: "She speaks English ___.", answer: "well", hint: "副詞（うまく）" },
  { sentence: "I need ___ water, please.", answer: "some", hint: "不可算名詞（肯定）" },
  { sentence: "How ___ does this shirt cost?", answer: "much", hint: "値段を聞く疑問詞" },
  { sentence: "I'm ___ to visit my grandparents.", answer: "going", hint: "近い未来の予定" },
  { sentence: "This restaurant is ___ than the one near the station.", answer: "better", hint: "good の比較級" },
  { sentence: "She has ___ finished her homework.", answer: "already", hint: "現在完了・完了副詞" },
  { sentence: "Could you tell me where the bank ___?", answer: "is", hint: "間接疑問文" },
  { sentence: "I ___ my phone on the train.", answer: "left", hint: "leave の過去形" },
  { sentence: "You ___ eat more vegetables.", answer: "should", hint: "助言・〜すべき（助動詞）" },
  { sentence: "He doesn't enjoy ___ early.", answer: "getting", hint: "enjoy + 動名詞" },
  { sentence: "The library ___ at eight in the evening.", answer: "closes", hint: "一般現在・三人称単数" },
  { sentence: "If the weather is nice, we ___ have a picnic.", answer: "will", hint: "第一条件文" },
  { sentence: "The cake ___ by my mother.", answer: "was made", hint: "受動態（過去）" },
  { sentence: "I'm afraid ___ dogs.", answer: "of", hint: "恐怖の対象を表す前置詞" },
  { sentence: "She asked me ___ I liked coffee.", answer: "if", hint: "Yes/No間接疑問" },
  { sentence: "You ___ park here. It's forbidden.", answer: "can't", hint: "禁止・してはいけない" },
  { sentence: "I haven't talked to her ___ April.", answer: "since", hint: "ある時点から（前置詞）" },
  { sentence: "While I ___ dinner, my friend called.", answer: "was cooking", hint: "過去進行形" },
  { sentence: "We're looking forward ___ our holiday.", answer: "to", hint: "楽しみにする構文の前置詞" },
  { sentence: "There isn't ___ sugar left.", answer: "any", hint: "否定文で使う語" },
  { sentence: "Both brothers ___ good at maths.", answer: "are", hint: "both + 複数動詞" },
];

const B1_QUESTIONS: QuestionDraft[] = [
  { sentence: "I've lived here ___ 2019.", answer: "since", hint: "ある年から継続（前置詞）" },
  { sentence: "If I ___ more money, I would travel more.", answer: "had", hint: "第二条件文" },
  { sentence: "The report must ___ finished today.", answer: "be", hint: "助動詞 + 受動態" },
  { sentence: "She apologized ___ being late.", answer: "for", hint: "謝罪の理由を表す前置詞" },
  { sentence: "He told me he ___ tired.", answer: "was", hint: "間接引話法（過去）" },
  { sentence: "The movie was ___ than I expected.", answer: "better", hint: "比較級" },
  { sentence: "We're thinking of ___ a new car.", answer: "buying", hint: "think of + 動名詞" },
  { sentence: "She doesn't mind ___ alone.", answer: "staying", hint: "mind + 動名詞" },
  { sentence: "By the time we arrived, the show ___ already started.", answer: "had", hint: "過去完了" },
  { sentence: "I'm not used to ___ up so early.", answer: "getting", hint: "be used to + 動名詞" },
  { sentence: "Despite ___ hard, he failed the exam.", answer: "studying", hint: "despite + 動名詞" },
  { sentence: "The man ___ car was stolen called the police.", answer: "whose", hint: "所有格の関係代名詞" },
  { sentence: "I'd rather ___ at home tonight.", answer: "stay", hint: "would rather + 動詞原形" },
  { sentence: "She suggested ___ a short break.", answer: "taking", hint: "suggest + 動名詞" },
  { sentence: "He is responsible ___ the whole team.", answer: "for", hint: "責任の対象を表す前置詞" },
  { sentence: "The letter ___ yesterday morning.", answer: "was delivered", hint: "受動態（過去）" },
  { sentence: "If you ___ harder, you would pass.", answer: "studied", hint: "第二条件文（if節は過去形）" },
  { sentence: "You ___ have told me earlier!", answer: "should", hint: "過去の後悔・〜すべきだった" },
  { sentence: "The book ___ I read was very interesting.", answer: "that", hint: "関係代名詞（目的格）" },
  { sentence: "He denied ___ the money.", answer: "taking", hint: "deny + 動名詞" },
  { sentence: "Not only ___ he speak French, but he also speaks Italian.", answer: "does", hint: "Not only の倒置" },
  { sentence: "I'd prefer you ___ smoke here.", answer: "didn't", hint: "would prefer + 過去形" },
  { sentence: "She ___ have missed the train; she isn't here yet.", answer: "might", hint: "可能性（過去の推量）" },
  { sentence: "The project, ___ was delayed twice, is finally complete.", answer: "which", hint: "非限定用法の関係代名詞" },
  { sentence: "Hardly ___ I arrived when it started raining.", answer: "had", hint: "Hardly ... when の倒置" },
  { sentence: "He wishes he ___ more time.", answer: "had", hint: "wish + 過去形" },
  { sentence: "It's time we ___ home.", answer: "went", hint: "It's time + 過去形" },
  { sentence: "The manager insisted on ___ the contract himself.", answer: "signing", hint: "insist on + 動名詞" },
  { sentence: "You can borrow it ___ you return it tomorrow.", answer: "if", hint: "条件を表す接続詞" },
  { sentence: "I was made ___ work on Saturday.", answer: "to", hint: "make の受動態（不定詞）" },
];

const B2_QUESTIONS: QuestionDraft[] = [
  { sentence: "I'm keen ___ learning new skills.", answer: "on", hint: "be keen の後に続く前置詞" },
  { sentence: "The meeting was ___ until further notice.", answer: "postponed", hint: "postpone の受動態" },
  { sentence: "She avoided ___ about the incident.", answer: "talking", hint: "avoid + 動名詞" },
  { sentence: "He succeeded ___ passing the exam.", answer: "in", hint: "succeed の後に続く前置詞" },
  { sentence: "We ran ___ money during the trip.", answer: "out of", hint: "run ___ money 慣用句" },
  { sentence: "The issue needs to be ___ immediately.", answer: "addressed", hint: "受動態（対処する）" },
  { sentence: "I'm accustomed ___ working long hours.", answer: "to", hint: "be accustomed の後に続く前置詞" },
  { sentence: "She made an effort ___ improve her pronunciation.", answer: "to", hint: "make an effort の後" },
  { sentence: "The policy aims to ___ unemployment.", answer: "reduce", hint: "失業率を下げる動詞" },
  { sentence: "He takes pride ___ his work.", answer: "in", hint: "take pride の後に続く前置詞" },
  { sentence: "I'm looking forward ___ meeting you next week.", answer: "to", hint: "look forward の後に続く前置詞" },
  { sentence: "My brother is used to ___ up early for work.", answer: "getting", hint: "be used to + 動名詞" },
  { sentence: "The new office ___ opened last spring.", answer: "was", hint: "受動態（過去形）" },
  { sentence: "If she ___ harder, she would get better results.", answer: "studied", hint: "第二条件文" },
  { sentence: "Mark said he ___ the email before lunch.", answer: "had sent", hint: "間接引話法（過去完了）" },
  { sentence: "Despite ___ heavily, we decided to go out.", answer: "raining", hint: "despite + 動名詞" },
  { sentence: "She ___ have left her keys at home; she can't find them.", answer: "might", hint: "可能性（過去の推量）" },
  { sentence: "The candidate ___ application was selected will start Monday.", answer: "whose", hint: "所有格の関係代名詞" },
  { sentence: "I'd rather you ___ tell anyone about this.", answer: "didn't", hint: "would rather + 過去形" },
  { sentence: "Not only ___ the team win the match, but they also broke a record.", answer: "did", hint: "Not only の倒置" },
  { sentence: "Were I in your position, I ___ act differently.", answer: "would", hint: "Were I ... の仮定法" },
  { sentence: "Little ___ he know what was about to happen.", answer: "did", hint: "Little did ... の倒置" },
  { sentence: "The committee is composed ___ twelve members.", answer: "of", hint: "be composed の後に続く前置詞" },
  { sentence: "She tends ___ worry too much.", answer: "to", hint: "tend の後に続く語" },
  { sentence: "It is essential that he ___ present at the meeting.", answer: "be", hint: "essential that + 原形" },
  { sentence: "The witness denied having ___ the document.", answer: "seen", hint: "deny having + 過去分詞" },
  { sentence: "On no account ___ employees share passwords.", answer: "should", hint: "On no account + 倒置" },
  { sentence: "The report makes reference ___ several studies.", answer: "to", hint: "make reference の後に続く前置詞" },
  { sentence: "He would rather his colleagues ___ him by his first name.", answer: "called", hint: "would rather + 過去形" },
  { sentence: "Under no circumstances ___ you open that door.", answer: "should", hint: "Under no circumstances + 倒置" },
];

const C1_QUESTIONS: QuestionDraft[] = [
  { sentence: "Had I known, I ___ have acted differently.", answer: "would", hint: "仮定法過去完了" },
  { sentence: "The proposal, ___ was widely criticized, was withdrawn.", answer: "which", hint: "非限定用法の関係代名詞" },
  { sentence: "Scarcely ___ the meeting begun when protests started.", answer: "had", hint: "Scarcely ... when の倒置" },
  { sentence: "Not until yesterday ___ she realize her mistake.", answer: "did", hint: "Not until の倒置" },
  { sentence: "Were it not for your help, I ___ have succeeded.", answer: "wouldn't", hint: "Were it not for 構文" },
  { sentence: "The manager, ___ opinion I respect, disagreed.", answer: "whose", hint: "関係代名詞（所有格）" },
  { sentence: "Little did she ___ that her life was about to change.", answer: "realize", hint: "Little did ... の倒置" },
  { sentence: "It is high time the government ___ action.", answer: "took", hint: "It is high time + 過去形" },
  { sentence: "The judge ruled that the evidence ___ inadmissible.", answer: "was", hint: "間接話法 + 形容詞" },
  { sentence: "He speaks as if he ___ everything.", answer: "knew", hint: "as if + 過去形" },
  { sentence: "No sooner had we sat down ___ the power went out.", answer: "than", hint: "No sooner に対応する語" },
  { sentence: "Seldom ___ I seen such a talented performer.", answer: "have", hint: "Seldom + 倒置" },
  { sentence: "The contract is subject ___ change.", answer: "to", hint: "subject の後に続く前置詞" },
  { sentence: "She attributed her success ___ hard work.", answer: "to", hint: "attribute の後に続く前置詞" },
  { sentence: "The film was so dull that I ___ asleep.", answer: "fell", hint: "fall asleep の過去形" },
  { sentence: "Were ___ not for the rain, the event would have been outdoors.", answer: "it", hint: "Were ___ not for 構文の空欄" },
  { sentence: "The CEO is alleged ___ have embezzled funds.", answer: "to", hint: "be alleged の後に続く語" },
  { sentence: "Much as I admire him, I ___ agree with this decision.", answer: "cannot", hint: "Much as（譲歩）" },
  { sentence: "The findings are consistent ___ earlier research.", answer: "with", hint: "consistent の後に続く前置詞" },
  { sentence: "Barely ___ he finished speaking when the audience applauded.", answer: "had", hint: "Barely ... when の倒置" },
  { sentence: "Were the company ___ fail, hundreds would lose jobs.", answer: "to", hint: "Were ... 仮定構文" },
  { sentence: "Not only was the plan flawed, ___ it was also over budget.", answer: "but", hint: "Not only ... 後半の接続" },
  { sentence: "So compelling ___ the evidence that the jury decided quickly.", answer: "was", hint: "So ... that の倒置" },
  { sentence: "The minister denied that any wrongdoing ___ taken place.", answer: "had", hint: "間接話法 + 過去完了" },
  { sentence: "On no account ___ this information be shared externally.", answer: "should", hint: "On no account + 倒置" },
  { sentence: "The policy has done little, if ___, to reduce inequality.", answer: "anything", hint: "どちらかといえば（副詞句）" },
  { sentence: "Were I ___ choose, I would prioritize sustainability.", answer: "to", hint: "Were I 仮定構文の不定詞" },
  { sentence: "Rarely ___ such a compelling argument been presented.", answer: "has", hint: "Rarely + 倒置" },
  { sentence: "The amendment is intended to prevent abuse, ___ may occur.", answer: "as", hint: "〜する場合（関係副詞）" },
  { sentence: "Had the warning been heeded, the accident ___ been avoided.", answer: "would have", hint: "仮定法過去完了" },
];

export const SURVIVE_PRESETS: Record<SurvivePresetId, SurvivePreset> = {
  a2: {
    id: "a2",
    label: "A2（初級）",
    description: "基礎文法からA2上級まで、30問で段階的に難しくなります",
    questions: A2_QUESTIONS,
  },
  b1: {
    id: "b1",
    label: "B1（中級）",
    description: "中級文法・語彙を30問。後半はB2手前まで上がります",
    questions: B1_QUESTIONS,
  },
  b2: {
    id: "b2",
    label: "B2（中上級）",
    description: "B2レベルの文法・語彙を30問。徐々に難度が上がります",
    questions: B2_QUESTIONS,
  },
  c1: {
    id: "c1",
    label: "C1（上級）",
    description: "上級文法・倒置・仮定法など、30問の高難度コース",
    questions: C1_QUESTIONS,
  },
};

export const SURVIVE_PRESET_LIST: SurvivePreset[] = Object.values(SURVIVE_PRESETS);

export const DEFAULT_SURVIVE_PRESET: SurvivePresetId = "b2";

export function isSurvivePresetId(value: string): value is SurvivePresetId {
  return value in SURVIVE_PRESETS;
}

export function parseSurvivePreset(value: unknown): SurvivePresetId | null {
  if (typeof value !== "string") return null;
  return isSurvivePresetId(value) ? value : null;
}

export function getSurviveQuestions(presetId: SurvivePresetId): QuizQuestion[] {
  return withIds(SURVIVE_PRESETS[presetId].questions);
}

export function getSurvivePresetLabel(presetId: SurvivePresetId): string {
  return SURVIVE_PRESETS[presetId].label;
}
