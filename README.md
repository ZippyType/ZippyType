<div align="center">
  <img src="https://www.zippytype.vercel.app/oauth/logo.png" alt="ZippyType Logo" width="120" height="120" style="border-radius: 20px;" />
  <h1>ZippyType ⚡</h1>
  <p><strong>A high-performance typing competition app featuring AI-generated challenges, real-time analytics, and visual progress tracking.</strong></p>
  <p>
    <a href="https://zippytype.vercel.app">🌐 Visit ZippyType</a> •
    <a href="https://discord.gg/mN56zE5q5g">💬 Join Discord</a> •
    <a href="https://x.com/ZippyType/">🐦 Follow on X</a>
  </p>
</div>

---

## 🚀 Features

*   **🤖 AI-Generated Challenges:** Powered by Google Gemini and Github Models/OpenAI´s API to create dynamic, context-aware typing tests.
*   **🏎️ Real-Time Multiplayer:** Race against friends and other typists globally using WebSockets (Socket.io).
*   **📊 Advanced Analytics:** Track your WPM, accuracy, consistency, and progress over time.
*   **🔐 ZippyType OAuth 2.1 Provider:** Let users sign into your own apps using "Sign in with ZippyType" (PKCE supported).
*   **💎 Pro Membership:** Unlock exclusive features, badges, and themes via Stripe integration.
*   **🎮 Discord Integration:** Link your Discord account for exclusive roles and community features.
*   **🎵 Immersive Experience:** Custom in-game music and sound effects for a focused typing zone.

## 🛠️ Tech Stack

*   **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons
*   **Backend:** Node.js, Express, Socket.io
*   **Database & Auth:** Supabase (PostgreSQL, Auth, Storage)
*   **AI:** Google Gemini API (`@google/genai`), and OpenAI API (`@openai/openai`)
*   **Payments:** Stripe
*   **Hosting:** Vercel (Frontend) / Cloud Run (Backend)

## 💻 Local Development

**Prerequisites:** Node.js (v18+)

1. **Clone the repository**
   ```bash
   git clone https://github.com/zippytype/zippytype.git
   cd zippytype
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   GEMINI_API_KEY=your_gemini_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 🔌 Developer API (OAuth 2.1)

ZippyType acts as an OAuth 2.1 provider! You can integrate "Sign in with ZippyType" into your own applications.

1. Create an account on [ZippyType](https://zippytype.vercel.app).
2. Navigate to the **Developer Dashboard**.
3. Create a new OAuth Application to get your `client_id` and `client_secret`.
4. Use the provided HTML or React snippets to add the login button to your site.

## 📄 License

This project is licensed under the MIT License.
