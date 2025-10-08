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

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- API keys for OpenAI and/or Mistral
- (Optional) Helicone account for LLM observability

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/damyantjain/CoralCake.git
   cd CoralCake
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set your actual values:
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - `NEXT_PUBLIC_SUPABASE_URL` - From your Supabase project settings
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From your Supabase project settings
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `MISTRAL_API_KEY` - Your Mistral API key
   - `HELICONE_API_KEY` - Your Helicone API key (optional)

4. **Configure Supabase authentication**
   
   See [docs/SUPABASE_AUTH_SETUP.md](docs/SUPABASE_AUTH_SETUP.md) for detailed instructions on:
   - Setting up redirect URLs in Supabase dashboard
   - Configuring authentication for dev and production
   - Troubleshooting common auth issues

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

CoralCake is optimized for deployment on Vercel:

1. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Vercel will auto-detect Next.js and configure build settings

2. **Set environment variables in Vercel**
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `MISTRAL_API_KEY`
   - `HELICONE_API_KEY`

3. **Configure Supabase redirect URLs**
   - Add `https://your-domain.vercel.app/auth/callback` to allowed URLs
   - See [docs/SUPABASE_AUTH_SETUP.md](docs/SUPABASE_AUTH_SETUP.md) for details

4. **Deploy**
   - Push to main branch or click "Deploy" in Vercel dashboard

## Documentation

- **[Usage Guide](docs/USAGE_GUIDE.md)** - How to use CoralCake features
- **[Supabase Auth Setup](docs/SUPABASE_AUTH_SETUP.md)** - Authentication configuration for all environments
- **[Implementation Notes](docs/IMPLEMENTATION_NOTES.md)** - Technical implementation details

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx tsc --noEmit` - Run TypeScript type checking

### Code Quality

This project follows strict TypeScript practices:
- No `any` types allowed
- Proper error handling with `unknown` narrowing
- ESLint and type checking required for all commits

---

Visit the live app at: [https://coralcake.vercel.app](https://coralcake.vercel.app)
