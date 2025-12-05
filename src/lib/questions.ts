// 文件名: src/lib/questions.ts (v2.2 多场景支持版)

export type Dimension = 'lifestyle' | 'finance' | 'communication' | 'intimacy' | 'values';

// 新增：场景类型定义
export type ScenarioType = 'couple' | 'friend';

export interface Question {
    id: number;
    text: string;
    dimension: Dimension;
    weight?: number; // Default 1
    options: {
        value: number;
        label: string;
    }[];
}

export interface SoulProfile {
    version: number;
    name?: string;
    type?: ScenarioType; // 新增：场景类型，默认为 'couple'
    answers: number[]; // 1-5 scale
    timestamp: number;
}

// 迭代日志：
// - 新增 'intimacy' 维度 (Q33-Q40)，填补了亲密和原生家庭观念的空缺。
// - Lifestyle 维度拆分并精简至 12 题，包含单独的 '宠物' 和 '成瘾品' 问题。
// - Values 维度精简至 10 题，删除了混淆或相对不重要的议题。
// - v2.1: 引入加权算法，Values/Intimacy 权重更高。

export const QUESTIONS: Question[] = [
    // --- Layer 1: Lifestyle (生活习惯 - 12题, Weight 1.0)
    { id: 1, text: "你对室内整洁度的要求是什么？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "随性" }, { value: 2, label: "较随性" }, { value: 3, label: "普通" }, { value: 4, label: "较整洁" }, { value: 5, label: "洁癖" }] },
    { id: 2, text: "你对伴侣的作息时间（熬夜/早起）的接受程度？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "必须同步" }, { value: 2, label: "尽量同步" }, { value: 3, label: "看情况" }, { value: 4, label: "不太介意" }, { value: 5, label: "完全不干涉" }] },
    { id: 3, text: "你对养宠物（如猫狗）的态度和意愿？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "完全不能接受" }, { value: 2, label: "很难接受" }, { value: 3, label: "中立" }, { value: 4, label: "可以接受" }, { value: 5, label: "必须有" }] },
    { id: 4, text: "你对伴侣吸烟、饮酒或其他成瘾品的态度？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "零容忍" }, { value: 2, label: "尽量避免" }, { value: 3, label: "中立" }, { value: 4, label: "适度即可" }, { value: 5, label: "无所谓" }] },
    { id: 5, text: "周末休息时，你更倾向于哪种度过方式？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "完全宅家" }, { value: 2, label: "倾向宅家" }, { value: 3, label: "看心情" }, { value: 4, label: "倾向外出" }, { value: 5, label: "必须外出活动" }] },
    { id: 6, text: "你对饮食口味的偏好（如辣度/咸淡）有多坚持？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "非常挑剔" }, { value: 2, label: "比较挑剔" }, { value: 3, label: "一般" }, { value: 4, label: "比较随和" }, { value: 5, label: "完全不挑" }] },
    { id: 7, text: "你对运动健身的频率要求是？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "从不运动" }, { value: 2, label: "偶尔动动" }, { value: 3, label: "每周1-2次" }, { value: 4, label: "每周3-4次" }, { value: 5, label: "每天必须" }] },
    { id: 8, text: "你对家中物品摆放的秩序感要求？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "乱中有序" }, { value: 2, label: "大致归位" }, { value: 3, label: "普通" }, { value: 4, label: "井井有条" }, { value: 5, label: "严丝合缝" }] },
    { id: 9, text: "对于家务分配，你更倾向于？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "随性分配" }, { value: 2, label: "大致分工" }, { value: 3, label: "看谁有空" }, { value: 4, label: "明确分工" }, { value: 5, label: "严格轮值/外包" }] },
    { id: 10, text: "你对电子产品使用时长（如刷手机/打游戏）的看法？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "希望能严格控制" }, { value: 2, label: "希望能少一点" }, { value: 3, label: "适度就好" }, { value: 4, label: "比较宽松" }, { value: 5, label: "完全自由" }] },
    { id: 11, text: "你对旅行方式的偏好？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "随性漫游" }, { value: 2, label: "大致规划" }, { value: 3, label: "半自由行" }, { value: 4, label: "详细攻略" }, { value: 5, label: "特种兵打卡" }] },
    { id: 12, text: "你对个人空间（独处时间）的需求程度？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "希望能时刻粘在一起" }, { value: 2, label: "希望能多在一起" }, { value: 3, label: "平衡" }, { value: 4, label: "需要较多独处" }, { value: 5, label: "极度需要独处" }] },

    // --- Layer 2: Finance (金钱观 - 10题, Weight 1.5)
    { id: 13, text: "在共同消费中，你倾向于AA制还是混合记账？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "严格AA" }, { value: 2, label: "大额AA" }, { value: 3, label: "轮流付" }, { value: 4, label: "大部分共享" }, { value: 5, label: "完全不分你我" }] },
    { id: 14, text: "你对伴侣的消费习惯的容忍度？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "必须节俭" }, { value: 2, label: "倾向节俭" }, { value: 3, label: "适度消费" }, { value: 4, label: "倾向享受" }, { value: 5, label: "享受当下" }] },
    { id: 15, text: "你对冲动消费的自我评级？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "从不冲动" }, { value: 2, label: "很少冲动" }, { value: 3, label: "偶尔" }, { value: 4, label: "经常冲动" }, { value: 5, label: "购物狂" }] },
    { id: 16, text: "你认为伴侣是否有知晓你所有收入和支出的权利？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "完全隐私" }, { value: 2, label: "保留部分隐私" }, { value: 3, label: "看情况" }, { value: 4, label: "大部分公开" }, { value: 5, label: "完全透明" }] },
    { id: 17, text: "你对负债消费（如信用卡/花呗）的态度？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "极度排斥" }, { value: 2, label: "尽量避免" }, { value: 3, label: "中立" }, { value: 4, label: "可以接受" }, { value: 5, label: "习以为常" }] },
    { id: 18, text: "你对投资理财的风险偏好？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "极度保守(储蓄)" }, { value: 2, label: "稳健理财" }, { value: 3, label: "平衡配置" }, { value: 4, label: "进取投资" }, { value: 5, label: "高风险高收益" }] },
    { id: 19, text: "对于大额支出（如买车/买房），决策方式倾向于？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "各自决定" }, { value: 2, label: "告知即可" }, { value: 3, label: "简单商量" }, { value: 4, label: "共同商议" }, { value: 5, label: "必须一致同意" }] },
    { id: 20, text: "你认为金钱在幸福生活中的重要性？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "够用就行" }, { value: 2, label: "基础保障" }, { value: 3, label: "重要" }, { value: 4, label: "非常重要" }, { value: 5, label: "决定性因素" }] },
    { id: 21, text: "你是否有记账的习惯？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "从不记账" }, { value: 2, label: "偶尔记" }, { value: 3, label: "记大额" }, { value: 4, label: "经常记" }, { value: 5, label: "每一笔都记" }] },
    { id: 22, text: "如果伴侣收入比你高很多或低很多，你会介意吗？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "非常介意" }, { value: 2, label: "有点介意" }, { value: 3, label: "看情况" }, { value: 4, label: "不太介意" }, { value: 5, label: "完全不介意" }] },

    // --- Layer 3: Communication (沟通模式 - 10题, Weight 1.5)
    { id: 23, text: "遇到分歧时，你倾向于立即解决还是需要冷静期？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "必须马上沟通" }, { value: 2, label: "倾向当天解决" }, { value: 3, label: "看情况" }, { value: 4, label: "倾向冷静后再谈" }, { value: 5, label: "回避并冷静处理" }] },
    { id: 24, text: "你对伴侣的朋友圈子和社交活动参与的意愿？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "希望完全融入" }, { value: 2, label: "希望能经常参与" }, { value: 3, label: "偶尔参与" }, { value: 4, label: "很少参与" }, { value: 5, label: "互不打扰" }] },
    { id: 25, text: "在关系中，你认为情绪表达应该被量化和克制吗？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "完全释放" }, { value: 2, label: "倾向直接表达" }, { value: 3, label: "看场合" }, { value: 4, label: "倾向克制" }, { value: 5, label: "高度理性克制" }] },
    { id: 26, text: "伴侣因小事生气时，你倾向于马上哄还是讲道理？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "马上哄" }, { value: 2, label: "先哄后道理" }, { value: 3, label: "看情况" }, { value: 4, label: "先讲道理" }, { value: 5, label: "坚持讲道理" }] },
    { id: 27, text: "你希望伴侣回复消息的频率是？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "秒回" }, { value: 2, label: "看到就回" }, { value: 3, label: "忙完回" }, { value: 4, label: "不固定" }, { value: 5, label: "轮回/电话联系" }] },
    { id: 28, text: "你对于“善意的谎言”的接受度？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "绝不接受" }, { value: 2, label: "尽量诚实" }, { value: 3, label: "看初衷" }, { value: 4, label: "可以接受" }, { value: 5, label: "为了和谐必须有" }] },
    { id: 29, text: "当你有负面情绪时，你希望伴侣如何处理？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "默默陪伴" }, { value: 2, label: "倾听不评判" }, { value: 3, label: "给拥抱" }, { value: 4, label: "给建议" }, { value: 5, label: "帮我分析解决" }] },
    { id: 30, text: "你认为在公共场合展示亲密行为（PDA）的尺度？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "完全拒绝" }, { value: 2, label: "仅限牵手" }, { value: 3, label: "适度亲密" }, { value: 4, label: "比较开放" }, { value: 5, label: "无视他人目光" }] },
    { id: 31, text: "你对异性（或同性）好友的边界感要求？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "极度敏感" }, { value: 2, label: "比较敏感" }, { value: 3, label: "正常社交即可" }, { value: 4, label: "比较宽松" }, { value: 5, label: "完全信任不干涉" }] },
    { id: 32, text: "你更倾向于哪种沟通风格？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "委婉含蓄" }, { value: 2, label: "比较委婉" }, { value: 3, label: "适中" }, { value: 4, label: "比较直接" }, { value: 5, label: "直来直去" }] },

    // --- Layer 4: Intimacy (亲密与家庭 - 8题, Weight 2.0)
    { id: 33, text: "你对亲密接触（身体或精神）的频率和需求？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "非常低" }, { value: 2, label: "较低，更重精神" }, { value: 3, label: "适中，平衡" }, { value: 4, label: "较高" }, { value: 5, label: "非常高，强烈依赖" }] },
    { id: 34, text: "你对伴侣的**仪式感**（如纪念日/节日）的看重程度？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "完全不看重" }, { value: 2, label: "偶尔即可" }, { value: 3, label: "看情况" }, { value: 4, label: "比较看重" }, { value: 5, label: "必须要有，并精心准备" }] },
    { id: 35, text: "你对未来与**双方原生家庭**相处方式的期望？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "老死不相往来" }, { value: 2, label: "仅限节日拜访" }, { value: 3, label: "适度联系，保持边界" }, { value: 4, label: "经常联系，互相帮助" }, { value: 5, label: "希望完全融入对方家庭" }] },
    { id: 36, text: "你对**生育**下一代的明确态度？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "坚决丁克" }, { value: 2, label: "倾向丁克" }, { value: 3, label: "顺其自然" }, { value: 4, label: "倾向生育" }, { value: 5, label: "必须生育" }] },
    { id: 37, text: "你对婚前/同居**共同财产**的看法？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "必须公正划分" }, { value: 2, label: "倾向区分" }, { value: 3, label: "看情况" }, { value: 4, label: "倾向共有" }, { value: 5, label: "完全共有不分彼此" }] },
    { id: 38, text: "如果发现伴侣与前任仍有联系，你的接受度？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "完全不能接受" }, { value: 2, label: "极度介意" }, { value: 3, label: "看情况" }, { value: 4, label: "接受普通朋友关系" }, { value: 5, label: "完全信任，不干涉" }] },
    { id: 39, text: "你认为伴侣关系中的**安全感**主要来自于？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "经济基础和物质承诺" }, { value: 2, label: "稳定的行为和时间投入" }, { value: 3, label: "平衡" }, { value: 4, label: "清晰的口头承诺和表达" }, { value: 5, label: "无条件的爱和信任" }] },
    { id: 40, text: "你希望伴侣如何给你提供情感支持（爱语倾向）？", dimension: 'intimacy', weight: 2.0, options: [{ value: 1, label: "服务行为 (做事)" }, { value: 2, label: "精心的礼物" }, { value: 3, label: "高品质的相处时间" }, { value: 4, label: "肯定的语言" }, { value: 5, label: "身体接触 (拥抱/牵手)" }] },

    // --- Layer 5: Values (核心价值观 - 10题, Weight 2.0)
    { id: 41, text: "在个人发展和家庭责任之间，你的首要权重？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "优先家庭" }, { value: 2, label: "倾向家庭" }, { value: 3, label: "平衡" }, { value: 4, label: "倾向事业" }, { value: 5, label: "优先个人事业" }] },
    { id: 42, text: "你对人生的重大风险（如投资/换城市）的看法？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "保守稳定" }, { value: 2, label: "倾向保守" }, { value: 3, label: "中庸" }, { value: 4, label: "倾向冒险" }, { value: 5, label: "冒险激进" }] },
    { id: 43, text: "你对承诺的看法，例如：迟到或失约的严重程度？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "非常看重" }, { value: 2, label: "比较看重" }, { value: 3, label: "一般" }, { value: 4, label: "比较包容" }, { value: 5, label: "理解弹性" }] },
    { id: 44, text: "在你的生活中，情感需求和理性分析哪个更重要？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "情感驱动" }, { value: 2, label: "倾向情感" }, { value: 3, label: "平衡" }, { value: 4, label: "倾向理性" }, { value: 5, label: "理性主导" }] },
    { id: 45, text: "你认为对错判断是否应该有绝对的标准？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "有绝对标准" }, { value: 2, label: "倾向有标准" }, { value: 3, label: "看情境" }, { value: 4, label: "倾向相对" }, { value: 5, label: "相对主义" }] },
    { id: 46, text: "你对“人无完人，所以不必强求改变”的认同度？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "完全不认同(需不断改变)" }, { value: 2, label: "不太认同" }, { value: 3, label: "中立" }, { value: 4, label: "比较认同" }, { value: 5, label: "完全认同(接纳本我)" }] },
    { id: 47, text: "你对社会时事和政治话题的关注度？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "完全不关心" }, { value: 2, label: "偶尔关注" }, { value: 3, label: "一般" }, { value: 4, label: "经常关注" }, { value: 5, label: "热衷讨论" }] },
    { id: 48, text: "你认为“成功”的定义更倾向于？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "财富地位" }, { value: 2, label: "社会认可" }, { value: 3, label: "平衡" }, { value: 4, label: "内心满足" }, { value: 5, label: "自由快乐" }] },
    { id: 49, text: "你对待“规则”的态度？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "严格遵守" }, { value: 2, label: "尽量遵守" }, { value: 3, label: "看情况" }, { value: 4, label: "灵活变通" }, { value: 5, label: "规则是用来打破的" }] },
    { id: 50, text: "你认为“平淡”是婚姻的最终归宿吗？", dimension: 'values', weight: 2.0, options: [{ value: 1, label: "绝不接受平淡" }, { value: 2, label: "努力抗拒" }, { value: 3, label: "接受但需调剂" }, { value: 4, label: "比较接受" }, { value: 5, label: "平淡才是真" }] },
];

// 新增维度中文映射
export const DIMENSION_DETAILS: Record<Dimension, { title: string; description: string }> = {
    lifestyle: { title: "第一步：生活习惯", description: "关于日常作息、卫生、娱乐、社交等硬性习惯的考察。" },
    finance: { title: "第二步：金钱与财务", description: "关于消费观、储蓄、投资和财务透明度的考察。" },
    communication: { title: "第三步：沟通与情感", description: "关于冲突处理、社交需求、情感表达和边界感的考察。" },
    intimacy: { title: "第四步：亲密与家庭观", description: "关于亲密需求、生育观、原生家庭和对安全感的深层考察。" },
    values: { title: "第五步：核心价值观", description: "关于人生目标、道德边界、风险偏好和世界观的深层考察。" },
};

// ============ 朋友默契度测试题库 (Friend Scenario) ============
// MVP 版本：8 道关于旅行、借钱、情绪价值、相处边界的题目

export const FRIEND_QUESTIONS: Question[] = [
    // --- 玩乐默契 (4题) ---
    { id: 1, text: "如果一起旅行，你希望的行程规划风格是？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "每分钟都排满" }, { value: 2, label: "大致有安排" }, { value: 3, label: "随性走停" }, { value: 4, label: "躺平型旅行" }, { value: 5, label: "完全临时起意" }] },
    { id: 2, text: "你对AA制或轮流请客的态度是？", dimension: 'finance', weight: 1.5, options: [{ value: 1, label: "必须精确AA到分" }, { value: 2, label: "大致AA" }, { value: 3, label: "轮流请客" }, { value: 4, label: "谁有空谁付" }, { value: 5, label: "关系好不计较" }] },
    { id: 3, text: "聚会时如果有人迟到，你的容忍度？", dimension: 'communication', weight: 1, options: [{ value: 1, label: "5分钟内必须到" }, { value: 2, label: "15分钟尚可" }, { value: 3, label: "半小时算正常" }, { value: 4, label: "1小时内都行" }, { value: 5, label: "来不来无所谓" }] },
    { id: 4, text: "你认为好朋友应该隔多久见一次面？", dimension: 'lifestyle', weight: 1, options: [{ value: 1, label: "每周必须见" }, { value: 2, label: "每两周" }, { value: 3, label: "每月一次" }, { value: 4, label: "每季度" }, { value: 5, label: "一年见几次也行" }] },

    // --- 情绪价值与边界 (4题) ---
    { id: 5, text: "朋友向你借钱（不小的数目），你的态度？", dimension: 'finance', weight: 2, options: [{ value: 1, label: "关系再好也不借" }, { value: 2, label: "写欠条才借" }, { value: 3, label: "看关系和数额" }, { value: 4, label: "关系好就借" }, { value: 5, label: "朋友开口必须帮" }] },
    { id: 6, text: "朋友深夜emo找你吐槽，你的反应？", dimension: 'communication', weight: 1.5, options: [{ value: 1, label: "不接受深夜打扰" }, { value: 2, label: "可以但希望简短" }, { value: 3, label: "陪聊但不给建议" }, { value: 4, label: "认真分析给建议" }, { value: 5, label: "随叫随到全力陪伴" }] },
    { id: 7, text: "你会主动分享自己的私事或秘密吗？", dimension: 'intimacy', weight: 1.5, options: [{ value: 1, label: "从不分享" }, { value: 2, label: "很少分享" }, { value: 3, label: "看关系亲疏" }, { value: 4, label: "经常分享" }, { value: 5, label: "无话不谈" }] },
    { id: 8, text: "如果朋友做了让你不舒服的事，你会怎么处理？", dimension: 'values', weight: 2, options: [{ value: 1, label: "直接说出来" }, { value: 2, label: "找机会委婉提" }, { value: 3, label: "暗示一下" }, { value: 4, label: "忍一忍算了" }, { value: 5, label: "默默疏远" }] },
];

// 朋友场景的维度映射（简化版）
export const FRIEND_DIMENSION_DETAILS: Record<Dimension, { title: string; description: string }> = {
    lifestyle: { title: "第一部分：玩乐默契", description: "关于旅行、聚会、见面频率的考察。" },
    finance: { title: "第二部分：金钱观", description: "关于AA制和借钱态度的考察。" },
    communication: { title: "第三部分：沟通边界", description: "关于时间边界和情绪支持的考察。" },
    intimacy: { title: "第四部分：亲密程度", description: "关于分享隐私和信任度的考察。" },
    values: { title: "第五部分：处事原则", description: "关于冲突处理方式的考察。" },
};

// ============ 场景工具函数 ============

/**
 * 根据场景类型获取对应题库
 * @param scenario 场景类型，默认为 'couple'
 */
export const getQuestionsForScenario = (scenario: ScenarioType = 'couple'): Question[] => {
    return scenario === 'friend' ? FRIEND_QUESTIONS : QUESTIONS;
};

/**
 * 根据场景类型获取对应维度详情
 */
export const getDimensionDetailsForScenario = (scenario: ScenarioType = 'couple') => {
    return scenario === 'friend' ? FRIEND_DIMENSION_DETAILS : DIMENSION_DETAILS;
};