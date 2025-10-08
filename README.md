# CoralCake

CoralCake is a professional platform designed to compare the performance of various Large Language Models (LLMs) in real-time. It empowers developers, researchers, and organizations to run prompts across multiple LLM providers and evaluate their performance, latency, token usage, and associated costs.

## What is CoralCake?

CoralCake enables you to:
- Run the same prompt across leading LLMs (including OpenAI and Mistral models)
- Instantly compare response time, cost, and token consumption for each model
- Export results in CSV or JSON format for further analysis
- Compare historical test runs side-by-side
- Track performance trends and optimize model selection
- Gain actionable insights for model selection based on real-world requirements

Whether you are evaluating LLMs for integration, optimizing prompt engineering, or simply exploring new models, CoralCake streamlines benchmarking and decision-making.

## Key Features

- **Multi-Model Comparison**: Test prompts across OpenAI, Mistral, and more
- **Performance Metrics**: Track latency, token usage, and cost in real-time
- **Export Capabilities**: Download results as CSV or JSON
- **Historical Analysis**: Compare past runs and track trends over time
- **Cost Tracking**: Transparent pricing for informed decisions
- **User-Friendly Interface**: Clean, intuitive design for quick insights

## Technologies Used

- **Next.js**: Modern React framework for fast, scalable web applications
- **Supabase**: Backend as a Service for authentication and data storage
- **TypeScript**: Type-safe JavaScript for improved reliability
- **Doppler**: Secret management for environment variables
- **OpenAI & Mistral APIs**: Integration to leading LLM providers
- **Helicone**: API proxy for tracking usage and latency

## Use Cases

- **Prompt Benchmarking**: Compare LLMs side-by-side to identify the most cost-effective and performant model for your application.
- **Model Evaluation**: Test new LLMs as they are released and monitor their capabilities.
- **Cost Analysis**: Estimate and control token and monetary costs associated with different models.
- **Latency Testing**: Measure response times under real-world conditions.
- **AI Product Development**: Integrate LLM performance insights into your product workflow.

---

## Getting Started

### For Users

Visit the live app at: [https://coralcake.vercel.app](https://coralcake.vercel.app)

### For Developers

Want to contribute or run CoralCake locally? See our development guides:

- **[Development Guide](./docs/DEVELOPMENT.md)** - Complete setup instructions for local development
- **[Copilot Agent Setup](./docs/COPILOT_AGENT_SETUP.md)** - Guide for GitHub Copilot agents
- **[Usage Guide](./docs/USAGE_GUIDE.md)** - How to use CoralCake features
- **[Implementation Notes](./docs/IMPLEMENTATION_NOTES.md)** - Technical implementation details

Quick start:
```bash
# Clone the repository
git clone https://github.com/damyantjain/CoralCake.git
cd CoralCake

# Install dependencies
npm ci

# Copy environment variables template
cp .env.example .env.local
# Edit .env.local with your API keys (see Development Guide)

# Run development server
npm run dev
```

---

## Contributing

We welcome contributions! Before submitting a PR:

1. Read the [Development Guide](./docs/DEVELOPMENT.md)
2. Follow the [Copilot Instructions](./.github/copilot-instructions.md)
3. Ensure lint and typecheck pass: `npm run lint && npx tsc --noEmit`
4. Keep changes small and focused

---
