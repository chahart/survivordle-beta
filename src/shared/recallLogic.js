export function scoreSeason(guess, answer) {
  return Math.max(0, 40 - Math.abs(guess - answer) * 4);
}

export function scorePlacement(guess, answer) {
  return Math.max(0, 40 - Math.abs(guess - answer) * 4);
}

export function scoreAge(guess, answer) {
  const diff = Math.abs(guess - answer);
  if (diff <= 3)  return 12;
  if (diff <= 5)  return 8;
  if (diff <= 10) return 4;
  return 0;
}

export function scoreTribeColor(guess, answer) {
  return guess === answer ? 8 : 0;
}

export function scoreAll(guesses, answer) {
  const season     = scoreSeason(guesses.season,     answer.season);
  const placement  = scorePlacement(guesses.placement, answer.placement);
  const age        = scoreAge(guesses.age,            answer.age);
  const tribeColor = scoreTribeColor(guesses.tribeColor, answer.tribe_color);
  const total = season + placement + age + tribeColor;
  return { season, placement, age, tribeColor, total };
}

export function getGrade(score) {
  if (score === 100) return "A+";
  if (score >= 93)   return "A";
  if (score >= 90)   return "A-";
  if (score >= 87)   return "B+";
  if (score >= 83)   return "B";
  if (score >= 80)   return "B-";
  if (score >= 77)   return "C+";
  if (score >= 73)   return "C";
  if (score >= 70)   return "C-";
  if (score >= 67)   return "D+";
  if (score >= 63)   return "D";
  if (score >= 60)   return "D-";
  return "F";
}

export function buildStintMap(contestants) {
  const grouped = {};
  for (const c of contestants) {
    if (!grouped[c.castaway_id]) grouped[c.castaway_id] = [];
    grouped[c.castaway_id].push(c);
  }
  for (const id in grouped) {
    grouped[id].sort((a, b) => a.season - b.season);
  }
  const stintMap = {};
  for (const id in grouped) {
    grouped[id].forEach((c, idx) => {
      const labels = ["First Appearance", "Second Appearance", "Third Appearance", "Fourth Appearance", "Fifth Appearance"];
      stintMap[c.id] = c.returnee ? (labels[idx] || `Appearance ${idx + 1}`) : null;
    });
  }
  return stintMap;
}

export function pickRandom(pool, seenIds) {
  const available = pool.filter(c => !seenIds.has(c.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Returns "YYYYMMDD" for today in ET
export function getTodayKeyET() {
  const etStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return etStr.replace(/-/g, "");
}

// Returns { year, month, day } for a "YYYYMMDD" key
function parseKey(key) {
  return {
    year:  parseInt(key.slice(0, 4), 10),
    month: parseInt(key.slice(4, 6), 10),
    day:   parseInt(key.slice(6, 8), 10),
  };
}

// Ordered schedule of contestant IDs. Puzzle #N uses RECALL_SCHEDULE[N-1].
// First 6 are locked (already played). Remainder is a seeded shuffle of the full pool.
// To add new contestants: append their IDs to the end of this array.
export const RECALL_SCHEDULE = [
  "US0632_43", "US0642_43", "US0624_42", "US0611_42", "US0591_41", "US0604_41",
  "US0401_27", "US0333_22", "US0104_7", "US0150_20", "US0265_17", "US0690_46",
  "US0075_5", "US0278_18", "US0352_23", "US0737_49", "US0751_49", "US0563_38",
  "US0010_27", "US0747_49", "US0155_11", "US0546_37", "US0125_16", "US0283_19",
  "US0484_33", "US0336_22", "US0092_6", "US0318_21", "US0623_42", "US0407_28",
  "US0296_19", "US0730_48", "US0643_43", "US0216_14", "US0423_31", "US0149_10",
  "US0674_45", "US0627_43", "US0516_35", "US0044_3", "US0461_32", "US0022_2",
  "US0341_23", "US0179_34", "US0630_43", "US0258_20", "US0635_43", "US0556_40",
  "US0593_41", "US0055_22", "US0066_5", "US0270_18", "US0083_6", "US0047_3",
  "US0054_4", "US0628_43", "US0009_8", "US0112_34", "US0312_26", "US0036_3",
  "US0126_9", "US0729_48", "US0014_1", "US0429_38", "US0708_47", "US0218_16",
  "US0015_1", "US0094_8", "US0693_46", "US0677_45", "US0186_13", "US0179_12",
  "US0348_23", "US0472_32", "US0150_10", "US0423_28", "US0441_29", "US0672_45",
  "US0718_48", "US0697_46", "US0536_40", "US0325_22", "US0231_16", "US0064_4",
  "US0702_47", "US0230_15", "US0358_24", "US0010_1", "US0614_42", "US0168_12",
  "US0478_40", "US0464_32", "US0541_37", "US0231_20", "US0544_37", "US0304_21",
  "US0480_33", "US0093_6", "US0388_26", "US0386_25", "US0731_48", "US0215_14",
  "US0239_16", "US0513_35", "US0555_37", "US0723_48", "US0264_17", "US0198_13",
  "US0302_21", "US0443_30", "US0554_37", "US0260_17", "US0069_5", "US0498_33",
  "US0622_42", "US0326_22", "US0056_4", "US0111_16", "US0024_8", "US0686_46",
  "US0298_19", "US0328_22", "US0439_29", "US0267_18", "US0657_44", "US0169_12",
  "US0274_20", "US0236_15", "US0171_12", "US0428_29", "US0368_24", "US0207_14",
  "US0067_5", "US0020_2", "US0359_27", "US0384_26", "US0357_24", "US0166_11",
  "US0052_4", "US0348_26", "US0195_27", "US0597_41", "US0351_23", "US0458_30",
  "US0082_6", "US0394_26", "US0271_18", "US0331_22", "US0041_3", "US0358_27",
  "US0477_34", "US0456_34", "US0711_47", "US0658_44", "US0528_36", "US0363_24",
  "US0300_20", "US0233_15", "US0106_7", "US0636_43", "US0688_46", "US0003_1",
  "US0197_13", "US0579_39", "US0736_49", "US0330_22", "US0299_19", "US0364_24",
  "US0476_32", "US0610_42", "US0180_12", "US0023_31", "US0637_43", "US0013_8",
  "US0281_34", "US0526_36", "US0159_11", "US0451_30", "US0400_27", "US0320_21",
  "US0607_41", "US0525_36", "US0273_18", "US0660_44", "US0385_25", "US0638_43",
  "US0700_47", "US0276_18", "US0301_19", "US0062_4", "US0475_32", "US0433_31",
  "US0585_39", "US0035_3", "US0048_8", "US0485_34", "US0173_12", "US0706_47",
  "US0506_35", "US0027_8", "US0133_10", "US0424_28", "US0148_10", "US0146_10",
  "US0006_1", "US0446_30", "US0369_24", "US0125_9", "US0715_47", "US0043_3",
  "US0392_26", "US0455_30", "US0536_36", "US0548_37", "US0422_28", "US0572_39",
  "US0621_42", "US0583_39", "US0156_11", "US0247_16", "US0439_31", "US0210_14",
  "US0653_44", "US0032_27", "US0248_17", "US0259_26", "US0183_13", "US0197_40",
  "US0099_7", "US0374_25", "US0114_9", "US0307_21", "US0311_21", "US0232_15",
  "US0573_39", "US0599_41", "US0176_12", "US0516_40", "US0235_16", "US0023_34",
  "US0201_16", "US0651_44", "US0164_11", "US0143_10", "US0678_45", "US0024_2",
  "US0154_11", "US0402_27", "US0206_14", "US0350_26", "US0288_25", "US0490_33",
  "US0222_15", "US0581_39", "US0728_48", "US0096_8", "US0038_3", "US0444_30",
  "US0258_17", "US0289_19", "US0433_40", "US0707_47", "US0209_14", "US0560_38",
  "US0518_36", "US0571_39", "US0578_39", "US0316_21", "US0540_37", "US0212_14",
  "US0378_25", "US0078_5", "US0460_30", "US0469_32", "US0107_20", "US0743_49",
  "US0433_29", "US0714_47", "US0575_39", "US0025_20", "US0470_32", "US0679_45",
  "US0280_18", "US0197_16", "US0323_22", "US0640_43", "US0002_1", "US0537_37",
  "US0530_36", "US0644_43", "US0360_24", "US0421_28", "US0259_17", "US0401_34",
  "US0058_4", "US0240_16", "US0414_40", "US0524_36", "US0097_7", "US0701_47",
  "US0055_40", "US0118_9", "US0277_18", "US0178_12", "US0355_24", "US0633_43",
  "US0313_21", "US0356_24", "US0167_12", "US0281_20", "US0105_31", "US0722_48",
  "US0019_2", "US0673_45", "US0004_1", "US0162_11", "US0201_23", "US0662_44",
  "US0277_20", "US0333_34", "US0027_40", "US0474_32", "US0424_40", "US0366_24",
  "US0197_20", "US0221_14", "US0297_19", "US0663_45", "US0746_49", "US0408_28",
  "US0241_16", "US0417_28", "US0510_35", "US0485_33", "US0300_19", "US0713_47",
  "US0454_30", "US0109_7", "US0236_20", "US0464_34", "US0250_17", "US0300_22",
  "US0098_7", "US0256_17", "US0040_3", "US0249_17", "US0587_39", "US0365_24",
  "US0726_48", "US0201_34", "US0498_40", "US0740_49", "US0235_20", "US0377_25",
  "US0144_10", "US0065_5", "US0595_41", "US0419_28", "US0375_25", "US0145_10",
  "US0493_33", "US0059_4", "US0072_5", "US0181_20", "US0343_23", "US0175_12",
  "US0087_6", "US0135_10", "US0648_44", "US0559_38", "US0589_39", "US0112_7",
  "US0466_32", "US0266_18", "US0347_23", "US0384_25", "US0709_47", "US0138_10",
  "US0479_33", "US0051_4", "US0453_31", "US0144_20", "US0227_15", "US0689_46",
  "US0252_17", "US0696_46", "US0015_31", "US0062_8", "US0263_20", "US0539_37",
  "US0107_7", "US0418_28", "US0190_13", "US0527_36", "US0192_13", "US0322_22",
  "US0213_14", "US0675_45", "US0467_32", "US0738_49", "US0050_4", "US0482_33",
  "US0371_24", "US0322_26", "US0371_40", "US0561_38", "US0284_19", "US0132_10",
  "US0080_5", "US0131_10", "US0386_40", "US0280_31", "US0160_11", "US0618_42",
  "US0529_36", "US0073_5", "US0456_30", "US0068_5", "US0396_26", "US0032_2",
  "US0233_31", "US0487_33", "US0084_6", "US0022_25", "US0500_35", "US0046_8",
  "US0449_30", "US0576_39", "US0055_4", "US0309_21", "US0140_10", "US0048_40",
  "US0520_36", "US0208_14", "US0639_43", "US0226_15", "US0076_5", "US0457_30",
  "US0346_26", "US0053_4", "US0295_31", "US0246_16", "US0353_40", "US0014_8",
  "US0399_27", "US0096_6", "US0452_30", "US0127_16", "US0442_29", "US0613_42",
  "US0517_36", "US0584_39", "US0620_42", "US0567_38", "US0566_38", "US0649_44",
  "US0272_18", "US0071_8", "US0383_31", "US0315_21", "US0085_6", "US0033_3",
  "US0395_26", "US0181_12", "US0045_8", "US0705_47", "US0522_36", "US0592_41",
  "US0556_37", "US0238_16", "US0580_39", "US0037_3", "US0001_1", "US0324_22",
  "US0061_4", "US0120_9", "US0063_4", "US0682_46", "US0372_25", "US0359_24",
  "US0202_13", "US0094_6", "US0431_29", "US0185_13", "US0645_44", "US0549_37",
  "US0115_9", "US0562_38", "US0406_34", "US0196_25", "US0570_38", "US0308_21",
  "US0303_21", "US0179_20", "US0681_46", "US0205_14", "US0152_11", "US0505_35",
  "US0281_18", "US0511_35", "US0489_33", "US0350_23", "US0685_46", "US0450_30",
  "US0287_19", "US0234_15", "US0741_49", "US0665_45", "US0721_48", "US0410_28",
  "US0652_44", "US0174_12", "US0654_44", "US0550_37", "US0745_49", "US0750_49",
  "US0655_44", "US0031_8", "US0488_33", "US0013_1", "US0042_3", "US0512_35",
  "US0691_46", "US0471_32", "US0112_40", "US0692_46", "US0200_13", "US0285_19",
  "US0017_2", "US0735_49", "US0626_42", "US0605_41", "US0397_27", "US0495_38",
  "US0504_35", "US0748_49", "US0223_15", "US0295_19", "US0130_9", "US0353_23",
  "US0436_29", "US0608_41", "US0235_15", "US0081_6", "US0619_42", "US0349_23",
  "US0547_37", "US0625_42", "US0182_12", "US0406_31", "US0373_25", "US0262_17",
  "US0195_13", "US0091_6", "US0429_31", "US0165_11", "US0055_8", "US0389_26",
  "US0402_31", "US0390_26", "US0717_48", "US0553_37", "US0422_31", "US0139_10",
  "US0514_35", "US0229_15", "US0733_48", "US0337_22", "US0244_16", "US0491_33",
  "US0606_41", "US0225_15", "US0170_12", "US0470_34", "US0532_36", "US0211_14",
  "US0694_46", "US0463_32", "US0393_26", "US0507_35", "US0312_21", "US0346_23",
  "US0231_15", "US0425_29", "US0720_48", "US0533_36", "US0609_42", "US0224_15",
  "US0292_27", "US0687_46", "US0695_46", "US0112_20", "US0669_45", "US0288_19",
  "US0344_23", "US0117_9", "US0021_31", "US0009_1", "US0634_43", "US0667_45",
  "US0552_37", "US0293_19", "US0332_22", "US0657_45", "US0196_16", "US0122_9",
  "US0496_33", "US0327_22", "US0123_9", "US0499_35", "US0337_26", "US0286_19",
  "US0121_9", "US0268_18", "US0016_1", "US0459_30", "US0089_6", "US0641_43",
  "US0180_31", "US0468_32", "US0166_40", "US0478_32", "US0026_2", "US0279_18",
  "US0564_38", "US0477_38", "US0557_38", "US0101_7", "US0016_8", "US0588_39",
  "US0220_14", "US0095_6", "US0030_2", "US0503_35", "US0086_6", "US0362_24",
  "US0490_34", "US0340_23", "US0486_33", "US0144_11", "US0070_5", "US0744_49",
  "US0602_41", "US0245_16", "US0335_22", "US0195_20", "US0438_29", "US0462_32",
  "US0257_17", "US0664_45", "US0034_3", "US0601_41", "US0435_29", "US0416_28",
  "US0329_22", "US0319_21", "US0531_36", "US0274_27", "US0196_13", "US0676_45",
  "US0111_7", "US0421_31", "US0724_48", "US0427_29", "US0542_37", "US0535_36",
  "US0725_48", "US0046_3", "US0342_23", "US0277_23", "US0365_27", "US0699_47",
  "US0107_27", "US0419_31", "US0021_2", "US0163_11", "US0274_40", "US0727_48",
  "US0136_10", "US0031_2", "US0237_15", "US0045_3", "US0031_20", "US0612_42",
  "US0102_7", "US0291_19", "US0182_27", "US0492_33", "US0157_11", "US0502_35",
  "US0569_38", "US0071_5", "US0151_11", "US0088_6", "US0497_33", "US0742_49",
  "US0646_44", "US0477_32", "US0079_5", "US0534_36", "US0594_41", "US0204_14",
  "US0391_26", "US0380_25", "US0008_1", "US0187_13", "US0263_17", "US0413_28",
  "US0124_9", "US0116_9", "US0007_1", "US0508_35", "US0415_28", "US0217_14",
  "US0403_27", "US0577_39", "US0269_18", "US0384_34", "US0521_36", "US0219_14",
  "US0074_5", "US0442_40", "US0214_14", "US0481_33", "US0107_8", "US0161_11",
  "US0603_41", "US0684_46", "US0275_18", "US0398_27", "US0404_27", "US0749_49",
  "US0704_47", "US0361_24", "US0193_13", "US0333_26", "US0367_24", "US0251_17",
  "US0025_8", "US0411_28", "US0253_17", "US0543_37", "US0739_49", "US0282_19",
  "US0515_35", "US0545_37", "US0202_40", "US0055_20", "US0424_34", "US0732_48",
  "US0680_46", "US0134_10", "US0039_3", "US0494_33", "US0128_9", "US0671_45",
  "US0141_11", "US0191_13", "US0716_48", "US0048_3", "US0127_9", "US0354_24",
  "US0551_37", "US0473_32", "US0596_41", "US0448_30", "US0387_26", "US0255_17",
  "US0495_33", "US0586_39", "US0012_1", "US0661_44", "US0029_2", "US0451_38",
  "US0153_11", "US0590_39", "US0177_12", "US0119_9", "US0194_13", "US0158_11",
  "US0376_25", "US0018_2", "US0568_38", "US0105_7", "US0414_34", "US0292_19",
  "US0565_38", "US0370_24", "US0703_47", "US0656_44", "US0243_16", "US0453_30",
  "US0188_13", "US0381_25", "US0440_29", "US0290_19", "US0509_35", "US0108_7",
  "US0057_4", "US0631_43", "US0615_42", "US0246_26", "US0426_29", "US0189_13",
  "US0049_4", "US0294_19", "US0314_21", "US0420_28", "US0254_17", "US0338_23",
  "US0501_35", "US0147_10", "US0683_46", "US0141_10", "US0305_21", "US0317_21",
  "US0306_21", "US0005_1", "US0574_39", "US0364_34", "US0274_18", "US0734_49",
  "US0650_44", "US0437_29", "US0090_6", "US0412_28", "US0100_7", "US0414_28",
  "US0719_48", "US0445_30", "US0261_17", "US0432_29", "US0666_45", "US0142_10",
  "US0451_31", "US0028_2", "US0137_10", "US0184_13", "US0027_2", "US0103_7",
  "US0582_39", "US0218_14", "US0339_23", "US0600_41", "US0110_7", "US0698_47",
  "US0710_47", "US0668_45", "US0523_36", "US0334_22", "US0032_8", "US0430_29",
  "US0629_43", "US0345_23", "US0598_41", "US0483_33", "US0025_2", "US0558_38",
  "US0179_16", "US0310_21", "US0616_42", "US0383_25", "US0077_5", "US0429_29",
  "US0409_28", "US0659_44", "US0712_47", "US0405_27", "US0199_13", "US0321_21",
  "US0011_1", "US0382_25", "US0617_42", "US0242_16", "US0476_34", "US0434_29",
  "US0023_2", "US0129_9", "US0203_14", "US0379_25", "US0228_15", "US0447_30",
  "US0172_12", "US0538_37", "US0670_45", "US0450_34", "US0647_44", "US0113_9",
  "US0406_27", "US0465_32", "US0201_13", "US0519_36", "US0060_4"
];

// The Recall Daily/Archive castaway for a given date key
export function getRecallAnswerForKey(pool, key) {
  const puzzleNum = getRecallPuzzleNumber(key);
  const id = RECALL_SCHEDULE[puzzleNum - 1];
  return pool.find(c => c.id === id) ?? pool[0];
}

// Today's Recall Daily castaway
export function getRecallDailyAnswer(contestants) {
  return getRecallAnswerForKey(contestants, getTodayKeyET());
}

// All past date keys (from RECALL_START_KEY up to but not including today), newest first
export const RECALL_START_KEY = "20260514";

export function getRecallPuzzleNumber(key) {
  const k = key || getTodayKeyET();
  const { year, month, day } = parseKey(k);
  const { year: sy, month: sm, day: sd } = parseKey(RECALL_START_KEY);
  const msPerDay = 86400000;
  return Math.max(1, Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(sy, sm - 1, sd)) / msPerDay) + 1);
}

export function getPastRecallKeys() {
  const todayKey = getTodayKeyET();
  const keys = [];
  // Walk backward from yesterday
  const today = new Date(
    parseInt(todayKey.slice(0, 4), 10),
    parseInt(todayKey.slice(4, 6), 10) - 1,
    parseInt(todayKey.slice(6, 8), 10)
  );
  const start = new Date(
    parseInt(RECALL_START_KEY.slice(0, 4), 10),
    parseInt(RECALL_START_KEY.slice(4, 6), 10) - 1,
    parseInt(RECALL_START_KEY.slice(6, 8), 10)
  );
  const cur = new Date(today);
  cur.setDate(cur.getDate() - 1);
  while (cur >= start) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    keys.push(`${y}${m}${d}`);
    cur.setDate(cur.getDate() - 1);
  }
  return keys;
}

// Format a date key as "Mon D, YYYY"
export function formatRecallKey(key) {
  const { year, month, day } = parseKey(key);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const GPA_SCALE = {
  "A+": 4.0, "A": 4.0, "A-": 3.66,
  "B+": 3.33, "B": 3.0, "B-": 2.66,
  "C+": 2.33, "C": 2.0, "C-": 1.66,
  "D+": 1.33, "D": 1.0, "D-": 0.66,
  "F": 0.0,
};

export function computeGPA(grades) {
  const valid = grades.filter(g => g != null && GPA_SCALE[g] !== undefined);
  if (!valid.length) return null;
  const sum = valid.reduce((acc, g) => acc + GPA_SCALE[g], 0);
  return (sum / valid.length).toFixed(1);
}

export function computeGradeDist(grades) {
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const g of grades) {
    if (!g) continue;
    if (g.startsWith("A")) dist.A++;
    else if (g.startsWith("B")) dist.B++;
    else if (g.startsWith("C")) dist.C++;
    else if (g.startsWith("D")) dist.D++;
    else dist.F++;
  }
  return dist;
}