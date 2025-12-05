# Match Score 🔮

> 探索灵魂的欧几里得距离，AI 驱动的深度契合度分析。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Astro](https://img.shields.io/badge/built%20with-Astro-orange.svg)
![React](https://img.shields.io/badge/framework-React-blue.svg)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-purple.svg)

**Match Score** 是一个基于 50 个心理和生活维度深度扫描的灵魂契合度测试应用。它不依赖传统数据库，而是将你的灵魂档案压缩为一段独一无二的 URL Hash。当两个 Hash 相遇，AI 将计算你们的“灵魂距离”，并生成一份直击痛点的深度分析报告。

---

## ✨ 核心特性

- **🧠 50 维度深度扫描**：涵盖生活习惯、价值观、沟通方式、财务观念等全方位测评。
- **🤖 AI 深度洞察**：集成 Google Gemini AI，不仅仅是打分，更提供“一针见血”的情感分析。
- **⚡️ 实时流式体验**：告别枯燥的 Loading，分析报告逐字生成，如同与一位老友促膝长谈。
- **🔒 极致隐私保护**：无中心化数据库，所有数据均存储于你的 URL Hash 中，你的秘密只属于你自己。
- **🛠️ 高度可定制**：支持自定义 AI Endpoint、API Key 和模型，掌握完全的控制权。

## 🛠 技术栈

- **核心框架**: [Astro](https://astro.build/) (SSR) + [React](https://reactjs.org/)
- **样式系统**: [Tailwind CSS](https://tailwindcss.com/)
- **AI 引擎**: [Google Generative AI SDK](https://github.com/google/google-api-nodejs-client)
- **数据编码**: [LZ-String](https://github.com/pieroxy/lz-string) (URL Safe Compression)
- **部署**: Vercel Serverless (Adapter Configured)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fmatch-score&env=GEMINI_API_KEY)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/match-score.git
cd match-score
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`（如果没有示例文件，请直接创建 `.env`）：

```bash
touch .env
```

编辑 `.env` 文件，填入你的 Google Gemini API Key：

```env
GEMINI_API_KEY=your_api_key_here
# 可选：自定义 AI Endpoint (如果使用代理或自定义服务)
# VITE_CUSTOM_AI_ENDPOINT=https://your-custom-endpoint.com/v1/chat/completions
```

### 4. 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
```

访问 `http://localhost:4321` 开始体验。

## 📖 使用指南

1.  **创建档案**：点击“开始测试”，完成 50 道深度选择题。
2.  **分享链接**：完成后，你将获得一个包含你灵魂 Hash 的专属链接。
3.  **邀请匹配**：将链接发送给朋友/伴侣。
4.  **查看报告**：对方完成测试后，系统将自动计算匹配度，并由 AI 生成详细的对比分析报告。

## 📂 项目结构

```
src/
├── components/    # React 组件 (问卷、报告、输入框等)
├── layouts/       # Astro 布局文件
├── lib/           # 核心逻辑 (AI 调用、编码解码、题库)
├── pages/         # 页面路由 (首页、匹配页、API)
└── env.d.ts       # 类型定义
```

## 🤝 贡献

欢迎提交 Pull Request 或 Issue！无论是修复 Bug、增加新功能，还是改进文档，我们都非常感谢。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。
