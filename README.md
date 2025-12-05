# Match Score (Soul Hash)

Match Score 是一个基于 50 个维度深度扫描的灵魂契合度测试应用。它通过计算你与他人的“灵魂欧几里得距离”，生成独一无二的分析报告。

## 特性

*   **深度分析**: 基于 50 个心理和生活维度的问卷。
*   **AI 驱动**: 使用 Google Gemini AI 生成详细的契合度报告。
*   **实时流式输出**: 报告生成过程实时可见，无需漫长等待。
*   **隐私优先**: 所有数据压缩编码为 URL Hash，无中心化数据库存储。
*   **自定义配置**: 支持用户配置自己的 AI 模型参数（Endpoint, API Key, Model）。

## 技术栈

*   **框架**: [Astro](https://astro.build/) + [React](https://reactjs.org/)
*   **样式**: [Tailwind CSS](https://tailwindcss.com/)
*   **AI**: [Google Generative AI SDK](https://github.com/google/google-api-nodejs-client)
*   **编码**: [LZ-String](https://github.com/pieroxy/lz-string) for URL compression

## 快速开始

1.  **克隆项目**

    ```bash
    git clone https://github.com/your-username/match-score.git
    cd match-score
    ```

2.  **安装依赖**

    ```bash
    npm install
    ```

3.  **配置环境变量**

    复制 `.env.example` 到 `.env` 并填入你的 Google Gemini API Key：

    ```bash
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **启动开发服务器**

    ```bash
    npm run dev
    ```

    访问 `http://localhost:4321` 开始体验。

## 部署

本项目可以直接部署到支持 SSR 的平台，如 Vercel, Netlify, 或 Node.js 服务器。

构建生产版本：

```bash
npm run build
```

## 许可证

MIT License
